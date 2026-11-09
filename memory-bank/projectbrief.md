# Project brief — Nexova Solutions

## Empresa y modelo de negocio

Nexova Solutions es una consultora de recursos humanos y adquisición de talento fundada en 2011, con sede en Valencia y oficina en Miami. El briefing describe 120 empleados e ingresos anuales aproximados de 8 millones de dólares. Sus líneas de negocio son headhunting para mandos medios y directivos, outsourcing de equipos de soporte al cliente y formación corporativa en habilidades blandas y liderazgo. Atiende principalmente a empresas medianas de tecnología, retail y servicios financieros.

## Problema y objetivo

Nexova tiene experiencia y una red sólida de candidatos y clientes, pero muchos procesos dependen del trabajo manual y de herramientas desconectadas: selección, seguimiento de candidatos, RR. HH., formación, soporte, ventas y reporting ejecutivo. Esto genera trabajo repetitivo, poca visibilidad operativa, incumplimientos del SLA de soporte (48 horas de resolución media frente a 24 horas comprometidas) y decisiones basadas en informes semanales atrasados.

El equipo de AI Engineering construye sistemas, automatizaciones y herramientas inteligentes para que Nexova pueda escalar sus servicios reduciendo el esfuerzo manual. Las oportunidades descritas en `BRIEFING.md` incluyen scoring y matching explicables de CVs, búsqueda semántica/RAG, portales y seguimiento de procesos, automatización de comunicaciones, herramientas de RR. HH. y formación, soporte asistido por RAG, telemetría y dashboards ejecutivos.

## Prioridades de producto reflejadas en este repositorio

- Hay una API local FastAPI con autenticación y módulos para usuarios/perfiles, análisis de incidencias y directorio de proveedores.
- Hay interfaces en `uis/`, incluido un backoffice estático, una demo Hito 2 y una aplicación Next.js de pipeline de candidaturas.
- `company-choice.md` propone un agente para ayudar a filtrar CVs frente a requisitos de vacantes; cualquier evaluación debe apoyar la decisión humana y mostrar evidencia, no presentar una recomendación automática como decisión final.
- El briefing plantea necesidades para varias áreas, pero no establece un único roadmap priorizado. No asumir prioridades, métricas objetivo adicionales ni integraciones no documentadas.

## Usuarios principales

Consultores de selección y candidatos; agentes y supervisores de soporte; personal de RR. HH.; responsables de formación; equipos de ventas y marketing; dirección ejecutiva; y el equipo de tecnología. Diseñar las capacidades según el rol y el proceso concreto, no como una solución genérica para todos.

## Fuente de verdad y cautelas

`BRIEFING.md` es la fuente de contexto de negocio. Para comportamiento técnico existente, prevalecen el código y la documentación de cada componente. El briefing presenta algunas diferencias entre nombres de responsables en la descripción organizativa y las secciones departamentales; confirmar el dato con el desarrollador antes de incorporarlo a funcionalidades o datos persistentes. Tratar CVs, datos de candidatos, empleados y clientes como información sensible: usar datos ficticios en ejemplos y no exponer datos personales en logs o reportes.
