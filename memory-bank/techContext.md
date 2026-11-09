# Contexto técnico — Nexova monorepo

## Estructura y convenciones

Este repositorio parte de una plantilla transversal AI Engineering, adaptada a Nexova. Mantener las responsabilidades existentes: `uis/` para aplicaciones de interfaz, `services/` para APIs y workers, `data/` para datos y pipelines, `agents/` para agentes de producto, `skills/` para capacidades reutilizables, `workflows/` para orquestación, `packages/` y `shared/` para reutilización, y `docs/` para documentación transversal. No crear un segundo árbol paralelo.

La capa de aplicación definida para este hito futuro (no implica que las apps ya existan) es:

- `uis/website`: web pública de Nexova; su vista de entrada debe responder en `/` y su marca/contenido deben alinearse con `BRIEFING.md`.
- `uis/backoffice`: aplicación interna con layout propio y separado de la web pública; su vista de entrada debe responder en `/`. El repo ya contiene páginas estáticas de backoffice y `uis/backoffice/hito2/`, que deben revisarse antes de añadir o reorganizar contenido.
- `services/`: APIs y servicios backend. La API existente está en `services/api/`.

Leer el README de la carpeta correspondiente antes de añadir aplicaciones o servicios. `uis/README.md` recomienda organizar por responsabilidades e incluir documentación técnica/funcional por aplicación; `services/README.md` pide documentar objetivo, tecnología y ejecución de cada servicio. No crear un árbol alternativo ni asumir que `uis/talent-pipeline/` reemplaza `uis/website/`.

## Stack comprobado en el repositorio

- Backend: Python 3.11+, FastAPI, Pydantic 2, TinyDB, Uvicorn y autenticación JWT; configuración en `pyproject.toml` y módulos bajo `services/api/`.
- Backend tests: pytest y httpx como extras de desarrollo.
- Frontend/demos: JavaScript/HTML/CSS estáticos y una aplicación Next.js con React y TypeScript en `uis/talent-pipeline/`.
- Raíz: `package.json` configura TypeScript 5.8 y scripts `typecheck`, `build:hito2-demo` y `serve:hito2-demo`. No hay runner de monorepo/workspaces configurado en la raíz.
- El pipeline de candidaturas documenta una API externa Tracker (`https://playground.4geeks.com/tracker/api/v1`); requiere `NEXT_PUBLIC_API_URL` en `.env.local` para desarrollo.

## Arquitectura y datos existentes

- FastAPI es el punto de entrada local de la API; `services/api/app.py` conecta routers/módulos y sirve algunas interfaces estáticas.
- La API configura su almacenamiento local TinyDB bajo `data/runtime/suppliers.json`; es estado mutable local, no un servicio de base de datos multiusuario. No usar como si garantizara aislamiento o persistencia de producción.
- El análisis de incidencias procesa CSV en memoria, con límite documentado de 5 MB y autenticación. No registra ni persiste el contenido del archivo; conserva solo el último agregado en memoria de la instancia.
- Configuración sensible como `SECRET_KEY` debe venir del entorno/`.env` y no debe entrar en Git. No hacer despliegues, migraciones, cambios de credenciales o cambios destructivos sin aprobación explícita.
- No hay telemetría/logging centralizado en el contexto actual; no afirmar que exista.

## Restricciones para cambios

- Mantener compatibles las convenciones y APIs existentes; consultar el código y README de cada área antes de cambios.
- Tratar información de candidatos, CVs, empleados y clientes como sensible. Minimizar su exposición, no incluirla en logs y usar fixtures ficticios.
- Scoring y ranking de candidatos deben ser explicables y apoyar revisión humana; no codificar decisiones laborales automáticas sin aprobación, requisitos legales y criterios documentados.
- No añadir apps de producto en carpetas paralelas a `uis/` o `services/`; no crear ahora website/backoffice nuevos como parte de la infraestructura de agentes.
- Documentar como decisiones futuras aquellas tecnologías o integraciones que solo aparecen como necesidades en `BRIEFING.md`; no presentarlas como ya implementadas.
