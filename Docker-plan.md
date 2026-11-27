# Plan de Dockerización y Despliegue — Nexova (Ticket #infra-40)

Este documento describe el plan completo, paso a paso y comentado, para dockerizar el monorepo de **Nexova** (`/uis` y `/services`), orquestarlo con Docker Compose en desarrollo con recarga en caliente y desplegarlo en el VPS existente, que por ahora dispone solo de IP pública. Mientras no haya dominio, el sitio público se servirá temporalmente por HTTP y el backoffice/API solo se alcanzarán mediante túnel SSH o VPN.

> **Estado:** Implementación inicial realizada en esta rama. Los builds de desarrollo y producción, la configuración Compose, los typechecks de las dos apps y la importación del backend con sus mounts compartidos se validaron localmente. No se inició el stack completo, porque requiere configurar `.env` con valores válidos; pytest tampoco está disponible en este entorno. El despliegue en VPS y la configuración real de Caddy/firewall quedan pendientes.

---

## 1. Arquitectura general y decisiones acordadas

```text
Navegador / Usuario
   ├── Local (dev):  http://localhost:3000 (website)
   │                 http://localhost:3001 (backoffice)
   │                 http://localhost:8000 (backend API / docs)
   │
     └── VPS (temporal, solo IP): Caddy por HTTP (puerto 80)
               └── http://<IP_PUBLICA>        ──► 127.0.0.1:3000 (website)
                 Backoffice :3001 y API :8000 solo por túnel SSH/VPN
                 HTTPS y subdominios quedan pendientes de dominio/TLS

                     ┌─────────────────── Red Docker: nexova-net (bridge) ───────────────────┐
                     │                                                                        │
                     │   ┌──────────────────────────────────┐       http://backend:8000       │
                     │   │ Servicio: uis (node:22-alpine)   │ ──────────────────────────────► │
                     │   │  - website    :3000 (Next.js)    │                                 │
                     │   │  - backoffice :3001 (Next.js)    │       ┌──────────────────────┐  │
                     │   └──────────────────────────────────┘       │ Servicio: backend    │  │
                     │                                              │ (python:3.12-slim)   │  │
                     │                                              │ FastAPI + Uvicorn    │  │
                     │                                              │ Puerto interno :8000 │  │
                     │                                              └──────────┬───────────┘  │
                     └─────────────────────────────────────────────────────────┼──────────────┘
                                                                               │
                                                                               ▼
                                                                   Supabase PostgreSQL
                                                                  (DATABASE_URL en .env)
```

### Resumen de decisiones cerradas

| Componente | Decisión |
| --- | --- |
| Imágenes base | `node:22-alpine` para `/uis` y `python:3.12-slim` para `/services` |
| Estrategia de Dockerfiles | Multi-stage (`dev` y `prod`) en `/uis/Dockerfile` y `/services/Dockerfile` |
| Servicios y red Compose | 2 servicios (`uis`, `backend`) en la red explícita `nexova-net` |
| Comunicación interna | Por nombre de servicio Docker: `BACKEND_URL=http://backend:8000` (nunca `localhost`) |
| Bind mounts en `uis` (dev) | Código fuente montado + volúmenes anónimos para `node_modules` y `.next` |
| Dependencias `scripts/` y `packages/` | Build desde `./services` en dev y prod; en prod se montan `./scripts` y `./packages` como `:ro` |
| Persistencia de datos | Inventario en Supabase (`DATABASE_URL` en `.env`); TinyDB (`data/runtime` dentro del contenedor) en volumen nombrado `nexova-runtime-data` en prod |
| Seguridad de secretos | Todas las variables viven en `.env` (ignorado en `.gitignore` y en ambos `.dockerignore`); `.env.example` sin valores reales |
| Exposición temporal en VPS | Website por HTTP a través de Caddy; backoffice/API ligados a `127.0.0.1` y accesibles solo por túnel SSH/VPN |
| HTTPS en VPS | No se asume certificado TLS para una IP sin dominio; habilitar Caddy/HTTPS cuando exista dominio o una solución TLS aprobada |

---

## 2. Paso a paso de implementación

### Paso 1 — Ajuste previo en el backend (`services/api/app.py`)

**Implementado:**
- Actualmente `services/api/app.py` monta obligatoriamente `StaticFiles(directory=ROOT / "uis" / "backoffice")` y `StaticFiles(directory=ROOT / "uis")`.
- Como el contenedor `backend` se construye desde `./services` y no contiene la carpeta `uis/`, FastAPI fallaría al iniciar si intenta montar directorios inexistentes.
- Se montan esos `StaticFiles` **solo si los directorios existen** (`if backoffice_dir.is_dir(): ...`). En ejecución local fuera de Docker sigue funcionando igual; dentro del contenedor backend arranca sin errores aunque no incluya `uis/`.

---

### Paso 2 — Contenedor de interfaces (`/uis`)

Archivos creados en `/uis/`:
1. `/uis/.dockerignore` (creado)
2. `/uis/start.sh` (creado)
3. `/uis/Dockerfile` (creado)

#### 2.1. `/uis/.dockerignore`

Evita enviar al contexto de build archivos pesados, artefactos locales o secretos (`.env` incluido explícitamente).

```dockerignore
# Secretos y configuraciones locales: NUNCA copiar .env dentro de la imagen Docker
.env
.env.*
.env*
**/.env
**/.env.*
**/.env*

# Dependencias instaladas en el host (se instalan limpiamente dentro de Alpine)
node_modules
**/node_modules

# Builds previos de Next.js generados en el host
.next
**/.next

# Logs y archivos temporales
*.log
**/*.log
npm-debug.log*

# Metadatos locales y repositorios
.git
.DS_Store
coverage
```

**Validación local:** `npm run typecheck` pasó en website y backoffice; las imágenes Docker de desarrollo y producción se construyeron correctamente.

#### 2.2. `/uis/start.sh`

Script POSIX (`#!/bin/sh`) ejecutado como `CMD` por defecto de `/uis/Dockerfile`. Arranca **ambas aplicaciones Next.js** desde el mismo contenedor en puertos distintos (`website` en `3000` y `backoffice` en `3001`), soporta modo `dev` (recarga en caliente con `npx next dev`) y modo `prod` (`npx next start`), y gestiona señales de apagado (`SIGTERM`/`SIGINT`).

El script real inicia ambos procesos y los espera individualmente. Compose lo ejecuta con `/bin/sh` explícitamente para que el shebang del archivo bind-mounted no se interprete como JavaScript por el entrypoint de Node.

```sh
#!/bin/sh
set -eu
MODE="${1:-${APP_MODE:-dev}}"
cleanup() {
  kill "${WEBSITE_PID:-}" "${BACKOFFICE_PID:-}" 2>/dev/null || true
  [ -n "${WEBSITE_PID:-}" ] && wait "$WEBSITE_PID" 2>/dev/null || true
  [ -n "${BACKOFFICE_PID:-}" ] && wait "$BACKOFFICE_PID" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' INT TERM

if [ "$MODE" = "prod" ]; then
  (cd /app/website && exec npm run start) & WEBSITE_PID=$!
  (cd /app/backoffice && exec npm run start) & BACKOFFICE_PID=$!
else
  (cd /app/website && exec npm run dev) & WEBSITE_PID=$!
  (cd /app/backoffice && exec npm run dev) & BACKOFFICE_PID=$!
fi

set +e
wait "$WEBSITE_PID"; WEBSITE_STATUS=$?
[ "$WEBSITE_STATUS" -eq 0 ] || kill "$BACKOFFICE_PID" 2>/dev/null || true
wait "$BACKOFFICE_PID"; BACKOFFICE_STATUS=$?
[ "$WEBSITE_STATUS" -eq 0 ] && [ "$BACKOFFICE_STATUS" -eq 0 ]
```

#### 2.3. `/uis/Dockerfile` (multi-stage: `base`, `deps`, `dev`, `prod`)

Instala las dependencias de `/uis/website` y `/uis/backoffice` **por separado** para aprovechar la caché de capas, mantiene un stage `dev` listo para bind mounts con hot reload y un stage `prod` con compilación `next build`.

```dockerfile
# ==============================================================================
# Stage 1: base — Imagen oficial ligera de Node 22 sobre Alpine Linux
# ==============================================================================
FROM node:22-alpine AS base
WORKDIR /app

# Desactiva la telemetría de Next.js dentro del contenedor
ENV NEXT_TELEMETRY_DISABLED=1

# ==============================================================================
# Stage 2: deps — Instala dependencias de website y backoffice POR SEPARADO
# ==============================================================================
FROM base AS deps

# 1) Dependencias de /uis/website
COPY website/package.json website/package-lock.json* ./website/
RUN cd /app/website && npm ci

# 2) Dependencias de /uis/backoffice
COPY backoffice/package.json backoffice/package-lock.json* ./backoffice/
RUN cd /app/backoffice && npm ci

# ==============================================================================
# Stage 3: dev — Entorno de desarrollo con recarga en caliente (bind mounts)
# ==============================================================================
FROM deps AS dev
ENV NODE_ENV=development
ENV APP_MODE=dev

# Copia código fuente inicial y el script de arranque unificado
COPY website ./website
COPY backoffice ./backoffice
COPY start.sh ./start.sh
RUN chmod +x /app/start.sh

# Puertos de website (3000) y backoffice (3001)
EXPOSE 3000 3001

# CMD del stage de desarrollo: invoca start.sh para levantar ambas apps Next.js
CMD ["/app/start.sh"]

# ==============================================================================
# Stage 4: builder — Compila ambas aplicaciones Next.js para producción
# ==============================================================================
FROM deps AS builder
ENV NODE_ENV=production

COPY website ./website
COPY backoffice ./backoffice

# Genera los builds optimizados por separado (.next)
RUN cd /app/website && npm run build
RUN cd /app/backoffice && npm run build

# ==============================================================================
# Stage 5: prod — Imagen final de producción para el VPS
# ==============================================================================
FROM base AS prod
ENV NODE_ENV=production
ENV APP_MODE=prod

# Copia solo los artefactos necesarios para ejecutar Next.js en producción
COPY --from=builder /app/website/package.json ./website/package.json
COPY --from=builder /app/website/next.config.ts ./website/next.config.ts
COPY --from=builder /app/website/node_modules ./website/node_modules
COPY --from=builder /app/website/.next ./website/.next

COPY --from=builder /app/backoffice/package.json ./backoffice/package.json
COPY --from=builder /app/backoffice/next.config.ts ./backoffice/next.config.ts
COPY --from=builder /app/backoffice/node_modules ./backoffice/node_modules
COPY --from=builder /app/backoffice/.next ./backoffice/.next

COPY start.sh ./start.sh
RUN chmod +x /app/start.sh

# Usuario sin privilegios de root para mayor seguridad en producción
RUN chown -R node:node /app
USER node

EXPOSE 3000 3001

# CMD de producción: invoca start.sh (usará APP_MODE=prod -> next start)
CMD ["/app/start.sh"]

# El último stage mantiene `docker build` sin --target orientado a desarrollo.
# Compose seleccionará explícitamente `target: prod` para el VPS.
FROM dev AS default
```

---

### Paso 3 — Contenedor del backend (`/services`)

Archivos creados en `/services/`:
1. `/services/requirements.txt`
2. `/services/.dockerignore`
3. `/services/Dockerfile`

#### 3.1. `/services/requirements.txt`

Dependencias explícitas de la API FastAPI (alineadas con `pyproject.toml`, incluyendo `httpx` utilizado en `services/api/auth.py` y `uvicorn[standard]` para recarga y rendimiento).

```txt
fastapi>=0.115,<1
python-multipart>=0.0.20,<1
uvicorn[standard]>=0.34,<1
tinydb>=4.8,<5
pydantic>=2.9,<3
email-validator>=2.2,<3
libpass[bcrypt]>=1.9.3,<2
bcrypt>=4.0,<6
python-jose[cryptography]>=3.3,<4
python-dotenv>=1,<2
sqlmodel>=0.0.14,<1
psycopg2-binary>=2.9,<3
httpx>=0.27,<1
psycopg[binary]>=3.2,<4
```

Se incluye `psycopg` v3 porque la URL SQLAlchemy `postgresql+psycopg://` requiere este driver; `psycopg2-binary` por sí solo no proporciona el módulo `psycopg`.

#### 3.2. `/services/.dockerignore`

Excluye secretos (`.env` incluido explícitamente), cachés de Python, bytecode, tests y logs.

```dockerignore
# Secretos y variables locales: NUNCA incluir en la imagen Docker
.env
.env.*
.env*
**/.env
**/.env.*
**/.env*

# Bytecode y cachés de Python
__pycache__
**/__pycache__
*.pyc
**/*.pyc
*.pyo
**/*.pyo
*.pyd

# Pruebas y entornos virtuales locales
tests/
**/tests/
.pytest_cache/
.venv/
*.egg-info/

# Logs y archivos del sistema
*.log
**/*.log
.DS_Store
```

#### 3.3. `/services/Dockerfile` (multi-stage: `base`, `dev`, `prod`)

Basado en `python:3.12-slim`, instala `uv`, crea un entorno virtual aislado fuera de `/app` (`/opt/venv`) para que los bind mounts de código nunca sobrescriban dependencias, instala desde `requirements.txt` con `uv pip install -r requirements.txt` y arranca Uvicorn.

```dockerfile
# ==============================================================================
# Stage 1: base — Imagen oficial Python 3.12 slim + instalación de uv y deps
# ==============================================================================
FROM python:3.12-slim AS base

# Evita archivos .pyc, activa logs sin buffer y añade /app al PYTHONPATH
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Instala uv (gestor rápido de paquetes Python) y crea el entorno virtual aislado
RUN pip install --no-cache-dir uv && uv venv /opt/venv

# Copia primero solo requirements.txt para aprovechar caché de capas Docker
COPY requirements.txt /app/services/requirements.txt
WORKDIR /app/services

# Instala las dependencias con uv usando el comando requerido
RUN uv pip install -r requirements.txt

# ==============================================================================
# Stage 2: dev — Desarrollo local con Uvicorn --reload y bind mounts
# ==============================================================================
FROM base AS dev

# Copia el código fuente de /services (en dev Compose montará el host encima)
COPY . /app/services

EXPOSE 8000

# Arranca FastAPI escuchando en todas las interfaces y vigila solo el código,
# no los datos persistentes montados en /app/data.
CMD ["uvicorn", "services.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/services", "--reload-dir", "/app/packages", "--reload-dir", "/app/scripts"]

# ==============================================================================
# Stage 3: prod — Producción en VPS sin --reload y con usuario no-root
# ==============================================================================
FROM base AS prod

# Crea un usuario sin privilegios y prepara la carpeta de runtime para TinyDB
RUN useradd --create-home --shell /bin/sh appuser \
    && mkdir -p /app/services /app/data/runtime

COPY . /app/services
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# 1 worker intencionado: TinyDB usa bloqueo en memoria por proceso (RLock);
# usar múltiples procesos podría corromper data/runtime/suppliers.json.
CMD ["uvicorn", "services.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# Deja dev como stage final y predeterminado para `docker build` sin --target.
# Compose seleccionará explícitamente `target: prod` en el despliegue.
FROM dev AS default
```

---

### Paso 4 — Variables de entorno (`.env` y plantilla)

- **Verificación de `.gitignore`**: `.env` ya figura en `.gitignore` (se comprobará también con `git log --all -- .env` que nunca estuvo en el historial de commits).
- **Plantilla `infra/docker.env.example`** (sin secretos reales) para que cualquier desarrollador la copie a `.env` en la raíz y rellene sus variables localmente. Se mantiene fuera del `.env.example` raíz porque ese archivo existente está ignorado por el entorno de edición:

```dotenv
# ==============================================================================
# Variables de entorno — Nexova Monorepo (plantilla SIN secretos reales)
# Copia este archivo a .env y completa los valores reales antes de levantar Docker.
# ==============================================================================

# --- Autenticación JWT (Backend) ---
SECRET_KEY=cambia-esta-clave-por-una-cadena-larga-y-aleatoria
ACCESS_TOKEN_EXPIRE_MINUTES=60
PASSWORD_RESET_EXPIRE_MINUTES=30

# --- Base de datos de inventario (Supabase / PostgreSQL) ---
DATABASE_URL=postgresql://postgres:TU_PASSWORD@TU_PROYECTO.supabase.co:5432/postgres?sslmode=require

# --- Correo transaccional (opcional en local) ---
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

# --- Comunicación entre servicios ---
# URL pública del frontend usada en enlaces de email. En el VPS no habilitar
# restablecimiento de contraseña por correo hasta disponer de HTTPS confiable,
# porque esos enlaces transportan tokens sensibles.
FRONTEND_BASE_URL=http://localhost:3000

# URL INTERNA dentro de la red Docker (usa el nombre del servicio, NUNCA localhost)
BACKEND_URL=http://backend:8000

# --- Desarrollo en contenedor (hot reload Next.js en bind mounts) ---
WATCHPACK_POLLING=true
```

---

### Paso 5 — Orquestación en desarrollo (`docker-compose.yml` en la raíz, creado)

Levanta toda la plataforma con `docker compose up`:
- Servicio `backend`: build desde `./services` (`target: dev`), bind mounts de código (`services`, `scripts`, `packages`, `data`), Uvicorn con `--reload`, variables desde `.env`.
- Servicio `uis`: build desde `./uis` (`target: dev`), bind mounts de `website` y `backoffice` + volúmenes anónimos para proteger `node_modules` y `.next` de Alpine, arranca `website` (`3000`) y `backoffice` (`3001`) en modo `dev`.
- Red Docker explícita `nexova-net`.

```yaml
services:
  backend:
    # Construye desde /services usando el stage de desarrollo
    build:
      context: ./services
      dockerfile: Dockerfile
      target: dev
    container_name: nexova-backend
    # Todas las variables y secretos se cargan exclusivamente desde .env
    env_file:
      - .env
    ports:
      # Expone FastAPI en el puerto 8000 del host
      - "8000:8000"
    volumes:
      # Bind mounts para reflejar cambios del host sin reconstruir la imagen
      - ./services:/app/services
      - ./scripts:/app/scripts
      - ./packages:/app/packages
      - ./data:/app/data
    # Uvicorn con recarga en caliente usando el entorno creado con uv
    command: ["uvicorn", "services.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/services", "--reload-dir", "/app/packages", "--reload-dir", "/app/scripts"]
    networks:
      - nexova-net

  uis:
    # Construye desde /uis usando el stage de desarrollo
    build:
      context: ./uis
      dockerfile: Dockerfile
      target: dev
    container_name: nexova-uis
    # Carga variables (incluyendo BACKEND_URL=http://backend:8000) desde .env
    env_file:
      - .env
    ports:
      # Website en 3000 y Backoffice en 3001
      - "3000:3000"
      - "3001:3001"
    volumes:
      # Bind mounts del código fuente de ambas apps Next.js para hot reload
      - ./uis/website:/app/website
      - ./uis/backoffice:/app/backoffice
      - ./uis/start.sh:/app/start.sh:ro
      # Volúmenes anónimos: protegen node_modules y .next de Alpine frente al host
      - /app/website/node_modules
      - /app/backoffice/node_modules
      - /app/website/.next
      - /app/backoffice/.next
    # Arranca ambas aplicaciones Next.js en modo desarrollo (npx next dev)
    command: ["/bin/sh", "/app/start.sh", "dev"]
    depends_on:
      - backend
    networks:
      - nexova-net

# Red Docker con nombre explícito para resolución DNS interna (backend <-> uis)
networks:
  nexova-net:
    name: nexova-net
    driver: bridge
```

---

### Paso 6 — Orquestación de producción (`docker-compose.prod.yml`, creado) y despliegue en VPS con IP pública

#### 6.1. `docker-compose.prod.yml` (en la raíz)

Diferencias clave respecto a desarrollo:
- Usa `target: prod` en ambos servicios (builds compilados con `next build`, sin `--reload` ni hot reload).
- `restart: unless-stopped` para recuperación automática tras reinicios del VPS.
- Los tres puertos de aplicación se ligan a `127.0.0.1`. Caddy escucha públicamente por HTTP en el puerto `80` y reenvía solo al website (`3000`).
- Backoffice (`3001`) y API (`8000`) permanecen sin exposición pública; el administrador accede con túnel SSH o VPN. HTTP no cifra credenciales ni tokens.
- No se configura HTTPS automático para la IP. HTTPS y acceso público al backoffice/API quedan pendientes hasta que exista un dominio o una solución TLS aprobada.
- La API se proxifica solo desde el backoffice con el prefijo `/backend`; el website público no tiene rewrite al backend. Así la API no queda accesible indirectamente desde el host HTTP público.
- Monta `./scripts` y `./packages` en modo solo lectura (`:ro`) para los imports del backend, y utiliza un **volumen Docker nombrado** (`nexova-runtime-data`) para persistir `data/runtime/suppliers.json` entre despliegues.

```yaml
services:
  backend:
    build:
      context: ./services
      dockerfile: Dockerfile
      target: prod
    container_name: nexova-backend-prod
    restart: unless-stopped
    env_file:
      - .env
    ports:
      # Solo loopback del VPS: administración mediante túnel SSH/VPN
      - "127.0.0.1:8000:8000"
    volumes:
      # Dependencias compartidas en solo lectura + volumen persistente para TinyDB
      - ./scripts:/app/scripts:ro
      - ./packages:/app/packages:ro
      - nexova-runtime-data:/app/data/runtime
    networks:
      - nexova-net

  uis:
    build:
      context: ./uis
      dockerfile: Dockerfile
      target: prod
    container_name: nexova-uis-prod
    restart: unless-stopped
    env_file:
      - .env
    ports:
      # Website para el reverse proxy local; backoffice solo mediante túnel SSH/VPN
      - "127.0.0.1:3000:3000"
      - "127.0.0.1:3001:3001"
    depends_on:
      - backend
    networks:
      - nexova-net

networks:
  nexova-net:
    name: nexova-net
    driver: bridge

volumes:
  nexova-runtime-data:
    name: nexova-runtime-data
```

#### 6.2. Configuración temporal de Caddy en el VPS (`/etc/caddy/Caddyfile`)

Mientras solo se disponga de IP pública, Caddy funciona como reverse proxy HTTP para el website. Este bloque **no habilita TLS** y no publica el backoffice ni la API:

```caddyfile
# Sitio público temporal por HTTP (Caddy escucha en el puerto 80)
:80 {
    reverse_proxy 127.0.0.1:3000
}
```

El acceso de administración se establece desde un equipo autorizado creando túneles, por ejemplo:

```bash
# En el equipo administrador: mantener esta sesión SSH abierta.
# El navegador local podrá abrir el backoffice/API por localhost; esos puertos no se publican en Internet.
ssh -N -L 3001:127.0.0.1:3001 -L 8000:127.0.0.1:8000 usuario@<IP_PUBLICA>
```

Después de comprar/configurar un dominio con DNS apuntando al VPS y decidir el alcance de publicación, se cambiará Caddy a hosts de dominio para que gestione certificados HTTPS. Hasta entonces no se deben enviar credenciales ni tokens por HTTP público.

---

## 3. Comandos más importantes

### Desarrollo local

```bash
# 1. Preparar variables locales a partir de la plantilla (solo la primera vez)
cp infra/docker.env.example .env
# (Edita .env con tu SECRET_KEY y DATABASE_URL reales de Supabase)

# 2. Construir imágenes y levantar todo el stack en primer plano
docker compose up --build

# 3. Levantar todo el stack en segundo plano (detached)
docker compose up -d

# 4. Ver estado de contenedores y puertos publicados
docker compose ps

# 5. Seguir logs en tiempo real de ambos servicios (o de uno en concreto)
docker compose logs -f
docker compose logs -f backend
docker compose logs -f uis

# 6. Detener y eliminar contenedores (conservando volúmenes)
docker compose down

# 7. Reconstruir sin caché tras cambiar dependencias (package.json / requirements.txt)
docker compose build --no-cache
docker compose up -d --force-recreate
```

### Verificación de comunicación interna y seguridad

```bash
# Probar resolución DNS interna de uis -> backend (sin usar localhost)
docker compose exec uis wget -qO- http://backend:8000/openapi.json | head -c 200

# Probar endpoints de salud de ambas apps Next.js (confirman backendReachable: true)
curl -s http://localhost:3000/api/health
curl -s http://localhost:3001/api/health

# Confirmar que .env está ignorado por Git y no aparece en el historial de commits
git check-ignore -v .env
git log --all --full-history -- .env

# Verificar que .env NO se copió dentro de las imágenes construidas
docker compose exec uis sh -c 'ls -la /app/.env /app/website/.env /app/backoffice/.env 2>&1 || true'
docker compose exec backend sh -c 'ls -la /app/.env /app/services/.env 2>&1 || true'
```

### Despliegue en el VPS (producción)

```bash
# 1. En el VPS: clonar o actualizar el repositorio
git clone <URL_DEL_REPO> nexova && cd nexova
# (Para actualizaciones posteriores: git pull)

# 2. Crear y proteger el archivo .env de producción (NUNCA versionarlo)
cp infra/docker.env.example .env
chmod 600 .env
nano .env
# Configura SECRET_KEY y DATABASE_URL de producción, además de las variables
# que aplique la instalación. Usa valores reales solo en el .env local del VPS.
# BACKEND_URL=http://backend:8000. No habilites correo de recuperación
# (RESEND_API_KEY) mientras FRONTEND_BASE_URL no tenga HTTPS confiable.

# 3. Construir y levantar el stack de producción en segundo plano
docker compose -f docker-compose.prod.yml up -d --build

# 4. Verificar que ambos contenedores estén activos y saludables
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50

# 5. Validar y recargar Caddy (configuración temporal HTTP para el website)
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 6. Comprobar firewall: SSH y HTTP público; no abrir 3001 ni 8000 al exterior.
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw deny 3001/tcp
sudo ufw deny 8000/tcp
sudo ufw status

# 7. Desde el equipo administrador, abrir un túnel para backoffice/API
ssh -N -L 3001:127.0.0.1:3001 -L 8000:127.0.0.1:8000 usuario@<IP_PUBLICA>
# Luego visitar http://localhost:3001 (backoffice) o http://localhost:8000/docs (API)
```

---

## 4. Checklist de validación final (criterios de `jinstrucciones.md`)

- [ ] `docker compose up` desde la raíz levanta `uis` y `backend` sin errores ni pasos manuales extra. **Pendiente:** requiere un `.env` local válido con secretos y `DATABASE_URL`; no se copiaron secretos al repositorio.
- [ ] Cambios en código del host se reflejan en caliente según los bind mounts y el reload configurados. **Configurado, pero falta probarlo con el stack corriendo.**
- [ ] Un único contenedor `uis` sirve website en `3000` y backoffice en `3001` vía `/uis/start.sh`. **Imágenes dev/prod construidas; runtime simultáneo pendiente.**
- [x] Comunicación interna vía nombre de servicio Docker (`http://backend:8000` en `nexova-net`); el proxy `/backend` solo se configura en backoffice.
- [x] No hay secretos ni API keys en Dockerfiles o Compose; se agregó `infra/docker.env.example` como plantilla sin credenciales.
- [x] `.env` está excluido por `.gitignore` y ambos `.dockerignore`; no se inspeccionó ni modificó ningún secreto.
- [x] Existen `/uis/.dockerignore` y `/services/.dockerignore`.
- [ ] Stack desplegado y operativo en el VPS. **No realizado:** se requiere autorización/operación separada y configuración específica del servidor.
- [ ] Backoffice (3001) y API (8000) comprobados cerrados en el firewall público. **No verificado en VPS**; Compose de producción los liga a `127.0.0.1`.
- [x] HTTPS queda explícitamente pendiente de dominio/TLS y no se declara habilitado.
- [x] `docker compose config -q` y su variante prod, builds dev/prod, `python -m compileall -q services/api`, `bash -n uis/start.sh`, `git diff --check`, typechecks de ambas apps e import backend con mounts compartidos pasaron.
- [ ] Suite pytest de `services/api/tests`. **No ejecutada:** `uv` y `pytest` no están instalados en el entorno.
