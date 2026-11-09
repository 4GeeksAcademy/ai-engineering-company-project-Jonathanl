# Instrucciones para agentes — Nexova

## Inicio obligatorio de cada sesión

Antes de planificar o modificar archivos del proyecto:

1. Lee `memory-bank/projectbrief.md` para entender Nexova, los usuarios y los problemas de negocio.
2. Lee `memory-bank/techContext.md` para respetar el stack, arquitectura y restricciones técnicas.
3. Lee `memory-bank/progress.md` para conocer el estado y los siguientes pasos registrados.
4. Para el área concreta que vayas a tocar, lee su README y las reglas aplicables en `.agents/rules/`. Si la tarea depende de requisitos de negocio, verifica también `BRIEFING.md`; si afecta a selección/candidatos, revisa `company-choice.md` cuando corresponda.

Si faltan datos, hay conflicto entre fuentes o se requiere una decisión de producto, seguridad o arquitectura no documentada, pregunta al desarrollador antes de improvisar.

## Proceso obligatorio antes de cada commit

No crear un commit hasta completar, en este orden, todos estos pasos:

1. **Alinear alcance:** comparar el cambio con la solicitud, `BRIEFING.md`, banco de memoria y README del área. Confirmar dudas y dejar fuera trabajo no solicitado.
2. **Revisar cambios:** inspeccionar `git diff` y `git status`; comprobar que solo estén incluidos archivos relacionados y que no haya secretos, datos personales, artefactos locales ni cambios accidentales.
3. **Validar:** ejecutar las comprobaciones específicas documentadas para los archivos afectados (por ejemplo, tests backend pertinentes o `npm run typecheck` para TypeScript). Si no se ejecutan, anotar la razón y no afirmar que pasaron.
4. **Revisar seguridad y comportamiento:** comprobar validación de entradas, errores, privacidad de datos personales, compatibilidad y que las salidas de IA sean revisables cuando afecten a candidatos o empleados.
5. **Actualizar documentación y memoria:** actualizar README, reglas o `memory-bank/progress.md` si el cambio altera uso, arquitectura, decisiones o estado del proyecto.
6. **Confirmar entrega:** presentar resumen, archivos y resultados de validación al desarrollador y solicitar autorización explícita para hacer commit. El agente no debe hacer commit ni abrir una PR sin solicitud/autorización explícita.

## Límites de modificación sin confirmación explícita

No modificar ni ejecutar cambios sobre estos elementos sin confirmación explícita del desarrollador:

- Secretos, credenciales, `.env`/configuración de entorno y valores de seguridad; nunca leerlos para exponerlos, imprimirlos o versionarlos.
- `BRIEFING.md`, contexto de negocio y decisiones/prioridades del producto.
- Base de datos o estado persistente real, datos de clientes/candidatos/empleados, seeds con datos reales, y operaciones de borrado o migración.
- Contratos/API existentes, autenticación/autorización, permisos o datos personales, salvo que la solicitud lo pida expresamente.
- Despliegues, infraestructura compartida, configuración de producción, integraciones externas con efectos reales y operaciones de envío de comunicaciones.
- Archivos o carpetas no relacionados con la tarea solicitada, y commits, push, publicación de ramas o apertura de PR.

La aprobación de un cambio debe ser explícita y específica; una petición general de implementar una feature no autoriza operaciones destructivas, despliegues ni publicación externa.

## Ubicación de aplicaciones

No inventar un árbol de aplicaciones paralelo:

- `uis/website/`: sitio público de Nexova, con marca y contenido alineados con `BRIEFING.md`.
- `uis/backoffice/`: interfaces internas, separadas visual y funcionalmente del sitio público. Ya existen páginas y una demo aquí; revisar antes de añadir.
- `services/`: APIs y servicios backend; revisar `services/README.md` antes de añadir módulos o servicios.

Lee `uis/README.md` o `services/README.md` antes de poner código en esas áreas. El hito de infraestructura de agentes no implica crear estas aplicaciones.

## Tarea recurrente

Para evaluar un lote ficticio de CVs contra una vacante, sigue `.agents/skills/evaluate-candidate-fit/SKILL.md`. No utilizar datos reales en ejemplos ni convertir el ranking en decisión automática de contratación.
