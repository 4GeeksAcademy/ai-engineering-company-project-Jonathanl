# Estado del proyecto

## Estado actual

Última actualización: 2026-11-09.

- Contexto de negocio de Nexova documentado en `BRIEFING.md`; contexto técnico comprobado en `pyproject.toml`, `package.json` y READMEs relevantes.
- El repositorio incluye API FastAPI para autenticación, usuarios/perfiles, incidencias y proveedores; interfaces estáticas/backoffice y un pipeline Next.js de candidaturas.
- La propuesta de agente para selección automatizada está descrita en `company-choice.md`; el briefing también enumera oportunidades para otras áreas. No se asume que esos agentes o sistemas estén implementados.
- Esta entrega implementa la infraestructura de agentes solicitada en `jinstrucciones.md`: banco de memoria, reglas operativas en `AGENTS.md`, reglas de `.agents/` y una skill con verificación explícita.

## Próximos pasos

1. Revisar los archivos creados y mantenerlos actualizados cuando cambien arquitectura, decisiones o estado de producto.
2. Para cada cambio futuro, seguir el proceso de `AGENTS.md`; ejecutar verificaciones específicas y registrar sus resultados.
3. Priorizar con el responsable del proyecto antes de iniciar una iniciativa de producto, dado que `BRIEFING.md` enumera varias necesidades y no fija un roadmap único.
4. Seguir las instrucciones de entrega de `jinstrucciones.md` (rama `feature/agent-memory-bank`, flujo previo al commit y PR a `main` del fork) cuando el desarrollador solicite preparar esa entrega.

## Pendiente / no verificado

- No se ha confirmado que exista una rama con nombre `feature/agent-memory-bank` ni se ha abierto una PR.
- No se ha ejecutado el flujo de validación/commit; esta fase se limita a implementar y revisar la documentación solicitada.
- Confirmar cualquier dato de negocio ambiguo antes de convertirlo en comportamiento o registros de producto.
