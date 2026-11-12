# Estado del proyecto

## Estado actual

Última actualización: 2026-11-12.

- Contexto de negocio de Nexova documentado en `BRIEFING.md`; `memory-bank/projectbrief.md` resume el modelo, problemas, usuarios y cautelas.
- `memory-bank/techContext.md` registra el stack y la arquitectura observados en el código, configuración y READMEs; distingue las capacidades actuales de las necesidades futuras.
- El repositorio contiene una API FastAPI en `services/api/`, interfaces estáticas/backoffice y una aplicación Next.js de pipeline de candidaturas en `uis/talent-pipeline/`.
- La propuesta de agente de selección está en `company-choice.md`; la skill `.agents/skills/evaluate-candidate-fit/SKILL.md` describe una evaluación ficticia y explicable con revisión humana.
- `AGENTS.md` define la lectura inicial del banco, las reglas de trabajo, el proceso ordenado antes del commit y los límites que requieren aprobación. `.agents/rules/nexova-development.md` se aplica al repositorio completo.
- Las ubicaciones previstas de aplicaciones son `uis/website/` (sitio público), `uis/backoffice/` (aplicación interna separada) y `services/` (APIs/servicios); documentarlas no significa que se estén creando como parte de esta tarea.

## Siguientes pasos

1. Revisar los entregables de infraestructura de agentes y confirmar que el banco coincide con el briefing y con el estado del repositorio.
2. Para cambios futuros, seguir el flujo de `AGENTS.md`, consultar los README del área y ejecutar las validaciones pertinentes.
3. Confirmar con el responsable cualquier prioridad de producto o dato de negocio ambiguo antes de convertirlo en comportamiento.
4. Seguir las instrucciones de entrega de `jinstrucciones.md` si el desarrollador solicita preparar commit/PR. La rama local actual es `feature/agent-memory-bank`; su upstream observado sigue siendo `origin/hito-04`, por lo que no asumir que ya se publicó o que existe una PR.

## Pendiente / no verificado

- La infraestructura documental fue inspeccionada frente al briefing y los README; no se ha ejecutado una suite de tests para cambios de documentación.
- No se ha creado commit, hecho push ni abierto una Pull Request.
- El trabajo de esta tarea no implementa las aplicaciones futuras ni el agente de selección como producto.
