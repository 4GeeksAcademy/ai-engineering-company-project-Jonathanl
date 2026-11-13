# Estado del proyecto

## Estado actual

Última actualización: 2026-11-13.

- Contexto de negocio de Nexova documentado en `BRIEFING.md`; `memory-bank/projectbrief.md` resume el modelo, problemas, usuarios y cautelas.
- `memory-bank/techContext.md` registra el stack y la arquitectura observados en el código, configuración y READMEs; distingue las capacidades actuales de las necesidades futuras.
- El repositorio contiene una API FastAPI en `services/api/`, interfaces estáticas/backoffice y una aplicación Next.js de pipeline de candidaturas en `uis/talent-pipeline/`.
- La propuesta de agente de selección está en `company-choice.md`; la skill `.agents/skills/evaluate-candidate-fit/SKILL.md` describe una evaluación ficticia y explicable con revisión humana.
- `AGENTS.md` define la lectura inicial del banco, las reglas de trabajo, el proceso ordenado antes del commit y los límites que requieren aprobación. `.agents/rules/nexova-development.md` se aplica al repositorio completo.
- Las ubicaciones futuras de aplicaciones son `uis/website/`, `uis/backoffice/` y `services/`; documentarlas no significa que se estén creando como parte de esta tarea.

## Siguientes pasos

1. Revisar la integración de la interfaz en el backoffice y capturar las pantallas solicitadas cuando se disponga del entorno visual.
2. Para cambios futuros, seguir el flujo de `AGENTS.md`, consultar los README del área y ejecutar las validaciones pertinentes.
3. Seguir las instrucciones de entrega de `jinstrucciones.md` si el desarrollador solicita preparar commit/PR. No asumir que la rama actual está publicada ni abrir PR sin autorización.

## Trabajo del gestor de incidencias

- `services/api/incident_models.py` define `IncidentCreate` con los campos obligatorios y enumeraciones del briefing, y `Incident` añade UUID y timestamps UTC autogenerados.
- `packages/shared/incident_csv.py` centraliza la validación de filas del CSV; el analizador existente y `scripts/seed_incidents.py` importan la misma función.
- `scripts/seed_incidents.py` transforma el histórico, inserta filas válidas en TinyDB e impide duplicados por `ticket_id`. La verificación del fixture produjo 96 válidas, 4 inválidas y los conteos transformados esperados; una segunda ejecución insertó 0.
- El seed usa `data/runtime/suppliers.json` por defecto para compartir la base local existente, y acepta `--db` para pruebas aisladas.
- Para ejecutar pytest en este entorno se añadió el root del monorepo a `sys.path` en `services/api/tests/conftest.py`.
- `services/api/incident_routes.py` implementa creación, consulta, filtros, transiciones de estado y métricas; `IncidentStore` se inicializa sobre la base TinyDB de la aplicación.
- Las rutas del gestor requieren autenticación como el resto de los endpoints de negocio. Las validaciones tienen respuestas `400` con campo y mensaje; identificadores inexistentes responden `404`; el handler global de excepciones evita exponer trazas.
- `services/api/tests/test_incident_routes.py` cubre el CRUD, filtros, transiciones, errores y resumen vacío/no vacío. La suite completa `PYTHONDONTWRITEBYTECODE=1 pytest -q -p no:cacheprovider services/api/tests` finalizó con 81 pruebas aprobadas.
- `uis/backoffice/index.html` y `incident-manager.js` integran inicio de sesión, registro, listado filtrable, actualización de estado con reversión visual, y panel de métricas. El token se mantiene en memoria de página, no en almacenamiento persistente; el analizador CSV existente utiliza ese mismo token.
- Las sedes, categorías, estados y orígenes se presentan con etiquetas del briefing. Se añadieron estados de carga/error/vacío y mensajes comprensibles sin exponer errores técnicos del servidor.

## Pendiente / no verificado

- No se generaron capturas de pantalla; falta una revisión visual en navegador con la API y una cuenta autenticada.
- No se ha creado commit, hecho push ni abierto una Pull Request.
- El trabajo de esta tarea no implementa las aplicaciones futuras ni el agente de selección como producto.
