# Brief técnico — Ticket #infra-40

El equipo necesita entornos de desarrollo reproducibles. Cada vez que alguien nuevo clona el repositorio, la puesta en marcha se convierte en una sesión de depuración de dependencias.

**Alcance**: dockerizar `/uis` (website + backoffice en un único contenedor de interfaces con recarga en caliente) y `/services` (FastAPI con `--reload`). La orquestación se gestiona con Docker Compose. Después despliega esos contenedores a producción en tu VPS existente.

**Criterio de aceptación:** cualquier miembro del equipo puede ejecutar `docker compose up` desde la raíz del repositorio y tener toda la plataforma operativa sin pasos adicionales; el mismo stack también está en producción en tu VPS.

Los servicios se comunican entre sí por nombre de servicio Docker, no por `localhost`. Revisa todas las URLs de conexión entre servicios antes del sign-off.