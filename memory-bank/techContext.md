# Contexto técnico — monorepo Nexova

## Estructura y ubicación de producto

Este repositorio adapta una plantilla transversal de AI Engineering. Mantén las responsabilidades existentes y lee el README del área antes de añadir código:

- `uis/`: interfaces. `uis/website/` es la ubicación prevista para el sitio público; debe atender `/` y alinearse con la marca y el contenido de `BRIEFING.md`. `uis/backoffice/` es para la aplicación interna, con layout propio y separada del sitio público; su vista de entrada debe atender `/`. Ya hay páginas estáticas y una demo bajo `uis/backoffice/`, pero la app pública de website aún no debe darse por implementada.
- `services/`: APIs y servicios backend. La ruta prevista para APIs es `services/`; existe una API en `services/api/`. Lee `services/README.md` antes de añadir módulos o servicios y documenta cada servicio.
- Lee `uis/README.md` antes de añadir interfaces. No trates `uis/talent-pipeline/` ni las páginas estáticas existentes como sustituto de `uis/website/`, ni crees un segundo árbol de frontend/API. Estas rutas describen la organización prevista; la tarea de infraestructura de agentes no pide crear o mover aplicaciones.
- `agents/`: agentes de producto; `skills/` y `.agents/skills/` contienen instrucciones reutilizables según su propósito.
- `data/`: datos y pipelines; `workflows/`: orquestación; `packages/`, `shared/` y `docs/`: reutilización y documentación transversal.

No inventar un árbol paralelo de aplicaciones ni mover o reorganizar contenido existente sin una solicitud explícita. La infraestructura de agentes no requiere crear aplicaciones.

## Stack comprobado

- Backend: Python 3.11+, FastAPI, Pydantic 2, TinyDB y Uvicorn. Dependencias y comandos están descritos en `pyproject.toml` y `services/api/README.md`.
- Backend de desarrollo/pruebas: pytest y httpx; ejecutar `uv run pytest services/api/tests` según el README de la API.
- Autenticación: JWT Bearer en la API; `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES` deben configurarse fuera de Git mediante entorno o `.env`.
- Frontend: páginas HTML/CSS/JavaScript estáticas y Next.js 15 con React 19 y TypeScript en `uis/talent-pipeline/`.
- En la raíz, `package.json` incluye TypeScript y los scripts `typecheck`, `build:hito2-demo` y `serve:hito2-demo`; no configura un workspace runner del monorepo.
- `uis/talent-pipeline/README.md` documenta una API externa Tracker y `NEXT_PUBLIC_API_URL` para esa aplicación concreta. No asumir que sea el backend de toda la empresa.

## Arquitectura y estado técnico observado

- `services/api/app.py` crea la aplicación FastAPI, incluye routers de usuarios/perfiles, proveedores y otras funciones, y sirve interfaces estáticas del backoffice.
- La API usa TinyDB local; el directorio de proveedores se almacena por defecto en `data/runtime/suppliers.json`. Es estado local mutable, no una base multiusuario o almacenamiento de producción.
- El análisis de incidencias procesa CSV en memoria, con límite de solicitud documentado de 5 MB; no guarda el contenido cargado y conserva el último agregado/exportación en memoria de la instancia.
- Hay pruebas en `services/api/tests/` para autenticación, configuración, seeds, proveedores y usuarios.
- No se debe afirmar que haya telemetría centralizada, despliegue de producción ni integraciones que solo aparecen como necesidades futuras en `BRIEFING.md`.

## Restricciones de ingeniería y seguridad

- No versionar, imprimir ni exponer secretos o valores de `.env`; no alterar credenciales.
- Tratar CVs y datos personales de candidatos, empleados y clientes como sensibles. Usar fixtures ficticios, evitar PII en logs y limitar la información expuesta.
- Ranking/matching de candidatos debe ser explicable, basado en requisitos explícitos y evidencia proporcionada, y sujeto a revisión humana. No inferir atributos protegidos ni automatizar decisiones de contratación.
- No realizar cambios destructivos sobre datos persistentes, migraciones, despliegues, integraciones con efectos reales ni comunicaciones externas sin aprobación explícita.
- Preservar contratos y comportamiento existentes. Ejecutar validaciones documentadas para los archivos afectados y no afirmar que pasaron si no se ejecutaron.
