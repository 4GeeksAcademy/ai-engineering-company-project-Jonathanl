# Contexto de Hito 2  — Desarrollando scripts para automatizar tareas
## Tu reto

Ya tienes la web pública de tu empresa funcionando con formularios y validaciones básicas. Ahora tu equipo técnico necesita que construyas las primeras funcionalidades internas que harán que el negocio opere de forma más eficiente.
Tu gerente te ha asignado implementar un conjunto de utilidades de procesamiento de datos que el equipo necesita para el día a día. No se trata de una interfaz completa todavía  sino de las funciones base que permitirán gestionar, filtrar, ordenar y transformar la información crítica del negocio. Piensa en esto como la capa lógica que otros sistemas utilizarán más adelante.
Estas utilidades deben estar escritas en TypeScript, ser reutilizables, estar correctamente tipadas y poder ejecutarse tanto en el navegador como en entornos de desarrollo. El énfasis está en dominar la manipulación de datos estructurados: colecciones, objetos, búsquedas, ordenamientos y transformaciones.

## Lo que te piden construir: Funcionalidades base para procesamiento de datos
Necesitamos que implementes un conjunto de funciones TypeScript que nos permitan manejar de forma eficiente los datos principales de la empresa. El objetivo es tener utilidades sólidas y bien tipadas que podamos reutilizar en múltiples contextos.

## Lo que necesitamos:
- Sistema de gestión de colecciones: Funciones para filtrar, ordenar, buscar y agrupar elementos dentro de arrays. Debes implementar búsqueda lineal para arrays desordenados y búsqueda binaria para arrays ordenados. Asegúrate de manejar correctamente casos vacíos y elementos no encontrados.
- Modelado de datos con objetos e interfaces: Define las interfaces TypeScript que representan las entidades principales del negocio. Cada interfaz debe tener tipos explícitos para todas sus propiedades y métodos auxiliares para trabajar con esos datos. Usa objetos literales para representar instancias concretas.
- Transformaciones y agregaciones: Implementa funciones que tomen colecciones de objetos y generen reportes simples: contar elementos por categoría, sumar valores numéricos, encontrar máximos y mínimos, calcular promedios. Todo debe estar tipado.
- Validaciones de negocio: Crea funciones que validen que los datos cumplan con las reglas específicas de tu empresa antes de ser procesados o almacenados. Por ejemplo, verificar que un elemento tenga todos los campos obligatorios, que los valores numéricos estén dentro de rangos permitidos, o que las fechas sean coherentes.
El código debe ser limpio, con nombres descriptivos, y cada función debe tener una sola responsabilidad para que sea mantenible a largo plazo.

## Estructura de archivos esperada:
Tu implementación debe organizarse en archivos TypeScript separados por responsabilidad:
src/
├── types/
│   └── models.ts          Interfaces y tipos
├── utils/
│   ├── collections.ts     # Funciones para arrays
│   ├── search.ts          # Búsquedas lineal y binaria
│   ├── transformations.ts # Agregaciones y reportes
│   └── validations.ts     # Validaciones de negocio
└── index.html             # Página de prueba (opcional)

Puedes incluir una página HTML simple con Tailwind CSS para probar tus funciones manualmente si lo deseas, pero el foco principal está en la lógica TypeScript. Como mínimo, tu proyecto debe incluir un comando claro para validar o ejecutar el código TypeScript durante el desarrollo, por ejemplo npx tsc --noEmit, npm run typecheck o npx tsx src/demo.ts.