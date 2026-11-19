# Project brief — Nexova Solutions

## Empresa y modelo de negocio

Nexova Solutions es una consultora de recursos humanos y selección de talento fundada en 2011, con sede en Valencia, España, y una oficina en Miami, Florida. El `BRIEFING.md` describe una plantilla de 120 empleados y unos ingresos anuales aproximados de 8 millones de dólares. Sus tres líneas de negocio son:

- Headhunting de perfiles de mandos medios y directivos.
- Outsourcing de equipos de soporte al cliente para empresas tecnológicas, retail y servicios financieros.
- Formación corporativa en habilidades blandas y liderazgo.

Nexova atiende principalmente a empresas medianas. Su ventaja es la experiencia y la red de candidatos y clientes construidas durante años; su reto es modernizar una operación que depende de procesos manuales y herramientas desconectadas.

## Problema y objetivo del proyecto

Los equipos de selección, soporte, ventas, RR. HH., formación, marketing y dirección tienen necesidades de automatización y visibilidad. Entre los problemas descritos están la revisión manual de CVs, el incumplimiento del SLA de soporte (48 horas de resolución media frente a 24 horas comprometidas), procesos de RR. HH. y formación gestionados con email y hojas de cálculo, seguimiento comercial inconsistente e informes ejecutivos semanales atrasados.

El equipo de AI Engineering construye sistemas, automatizaciones y herramientas inteligentes para reducir el trabajo manual y ayudar a Nexova a escalar. El briefing enumera oportunidades —como scoring explicable de CVs, búsqueda semántica/RAG, portales, automatización de comunicaciones, soporte asistido por RAG y dashboards—, pero no implica que estén ya implementadas ni define por sí solo un roadmap priorizado.

## Iniciativa de selección

`company-choice.md` propone un agente que compare evidencia de CVs con requisitos de vacantes para ayudar al equipo de selección. La evaluación debe ser explicable, limitarse a criterios laborales explícitos, usar datos ficticios en ejemplos y dejar la decisión final a una persona. La skill `.agents/skills/evaluate-candidate-fit/SKILL.md` especifica ese flujo y sus criterios de aceptación.

## Usuarios y áreas

Los usuarios potenciales incluyen consultores de selección y candidatos; agentes y supervisores de soporte; personal de RR. HH.; responsables de formación; ventas y marketing; dirección ejecutiva; y tecnología. Las necesidades deben tratarse por área y rol, no suponerse como una solución única.

## Fuentes de verdad y cautelas

- `BRIEFING.md` es la fuente principal para el contexto de negocio y las necesidades descritas.
- El código y los README de cada área determinan qué capacidades están implementadas y cómo funcionan.
- `company-choice.md` registra la propuesta de agente de selección, no una aprobación de decisiones automáticas de contratación.
- El briefing presenta diferencias entre nombres de responsables en distintas secciones. No codificar nombres de responsables como dato operativo sin confirmación del desarrollador.
- CVs y datos de candidatos, empleados y clientes son sensibles. No incluir PII real en ejemplos, fixtures o logs; usar datos ficticios y minimizar la exposición.
- No asumir objetivos, métricas, integraciones ni prioridades que no estén documentados y confirmados.
