# 💻 Lo que debes hacer

## Infraestructura de agentes

- Crear la carpeta `memory-bank/` en la raíz del monorepo con al menos los siguientes archivos:
  - `projectbrief.md` — descripción del negocio, los objetivos del proyecto y el problema que resuelve
  - `techContext.md` — stack tecnológico, decisiones de arquitectura tomadas y restricciones técnicas
  - `progress.md` — estado actual del desarrollo y próximos pasos previstos

- Crear el archivo `AGENTS.md` en la raíz del monorepo que defina:
  - Qué archivos del banco de memoria debe leer el agente al inicio de cada sesión
  - El flujo obligatorio antes de cada commit (mínimo 4 pasos ordenados y explícitos)
  - Las carpetas y archivos que el agente no debe modificar sin confirmación explícita del desarrollador

- Crear la carpeta `.agents/` con al menos una regla de desarrollo documentada con su alcance de aplicación (siempre activa, por patrón de archivo, o solicitada por el agente)

- Implementar al menos una skill de agente para una tarea recurrente del flujo de trabajo, con:
  - Un objetivo único y claramente definido
  - Inputs documentados
  - Criterios de aceptación explícitos y verificables

> ⚠️ IMPORTANTE: El banco de memoria, las reglas y la skill deben estar alineados con los datos, procesos y restricciones del `BRIEFING.md` de tu monorepo (el briefing de tu empresa). Una infraestructura genérica — o construida sobre el placeholder de plantilla sin reemplazar — no será aceptada.

---

## Carpetas del monorepo (capa de aplicación)

Este hito no te pide crear las apps. Aclara en el banco de memoria / reglas de agente dónde debe vivir el código de producto cuando se usen esas carpetas más adelante (o si la plantilla ya las trae). Sigue los README de la plantilla en cada ruta — no crees un segundo árbol de frontend o API en otro sitio.

| Ruta | Qué va aquí cuando se cree |
|--------|--------|
| `/uis` | Proyectos frontend de la empresa |
| `./uis/website` | Web corporativa de cara al público (ruta `/`, marca y copy alineados con `BRIEFING.md`) |
| `./uis/backoffice` | App interna de la empresa (layout propio, separado del sitio público; vista de entrada en `/`) |
| `/services` | APIs y servicios backend |

---

# ✅ Lo que evaluaremos

- El banco de memoria contiene contexto de negocio y contexto técnico — no solo uno de los dos.
- `AGENTS.md` especifica un flujo de trabajo con al menos 4 pasos ordenados antes del commit.
- La carpeta `.agents/` contiene al menos una regla con alcance de aplicación explícito.
- La skill implementada tiene objetivo único, inputs documentados y criterios de aceptación verificables.
- El banco de memoria y/o las reglas de agente dejan claro dónde encajan `/uis/website`, `/uis/backoffice` y `/services` — sin carpetas de app paralelas inventadas.

---

# 📦 Cómo entregar

1. Asegúrate de que tu rama de trabajo tenga el nombre `feature/agent-memory-bank`
2. Ejecuta el flujo de entrega definido en tu `AGENTS.md` antes del commit final
3. Abre una Pull Request hacia la rama `main` de tu fork
4. En la descripción de la PR incluye un enlace directo a tu `AGENTS.md`
5. Entrega el enlace a tu PR en el campus de 4Geeks