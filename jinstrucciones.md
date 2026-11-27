# Lo que debes hacer

## Dockerfile de interfaces (`/uis/Dockerfile`)

- Crea un Dockerfile en `/uis` basado en una imagen oficial de Node (Alpine). Debe instalar las dependencias de `/uis/website` y `/uis/backoffice` por separado.
- El `CMD` por defecto del Dockerfile debe invocar un script `start.sh` que arranque ambas aplicaciones Next.js en puertos distintos (`website` en el 3000, `backoffice` en el 3001).
- Crea `.dockerignore` en `/uis` que excluya al menos: `node_modules`, `.next`, `.env*` y `*.log`.

---

## Dockerfile del backend (`/services/Dockerfile`)

- Crea un Dockerfile en `/services` basado en una imagen oficial de Python. Debe instalar `uv`, instalar las dependencias desde `requirements.txt` con `uv pip install -r requirements.txt` y arrancar el servidor Uvicorn con `--reload` habilitado.
- Crea `.dockerignore` en `/services` que excluya al menos: `__pycache__`, `.pyc`, `.env*`, `tests/` y `*.log`.

---

## Docker Compose (`docker-compose.yml`)

- Crea `docker-compose.yml` en la raíz con dos servicios: el servicio de interfaces (build desde `/uis`, con bind mount sobre el código fuente y comando `npx dev` para ambas apps) y el servicio backend (build desde `/services`, con bind mount y `uv reload`).
- Expón los puertos correctos en cada servicio para que sean accesibles desde el host.
- Conecta ambos servicios en una red Docker con nombre definido explícitamente. Verifica que las URLs de conexión entre servicios usen el nombre del servicio como host, no `localhost`.

> ⚠️ Nunca incluyas secretos reales, API keys ni contraseñas en `docker-compose.yml` ni en ningún Dockerfile. Estos archivos se versionan en Git y cualquier persona con acceso al repositorio los podrá leer. Las credenciales viven exclusivamente en `.env`, que debe estar en `.gitignore`. Si accidentalmente comites un secreto, considera que está comprometido y rótalo inmediatamente.

- Define todas las variables de entorno de cada servicio mediante un archivo `.env` en la raíz del repositorio (no hardcodeadas en YAML).
- Confirma que `.env` está en `.gitignore` del repositorio.

---

## Despliegue a producción (VPS)

- Despliega los contenedores de monorepo a producción en un VPS.
- En VPS, los contenedores de interfaces y backend deben permanecer accesibles (misma idea de stack Compose que en local; las variables de producción viven en `.env`, no en Git).

---

# ✅ Lo que evaluaremos

- `docker compose up` desde la raíz levanta la plataforma completa sin errores y sin pasos adicionales de configuración.
- Los cambios en el código del host se reflejan en el navegador sin reconstruir la imagen (bind mounts funcionando en ambos servicios).
- El servicio de interfaces arranca ambas aplicaciones Next.js en puertos distintos (`3000` y `3001`) desde un único contenedor.
- Los servicios se comunican internamente por nombre de servicio Docker, no por `localhost` ni por IP hardcodeadas.
- No hay secretos, API keys ni contraseñas hardcodeadas en ningún Dockerfile ni en `docker-compose.yml`.
- El archivo `.env` está en `.gitignore` y no aparece en el historial de commits.
- Existen archivos `.dockerignore` en `/uis` y en `/services`.
- La aplicación funciona correctamente en producción en tu VPS existente (no solo en tu portátil).