# Contexto

El departamento de People & Talent de Nexova debe llevar el proceso de candidaturas y para eso equipo de Tecnología ya ha construido y expuesto una API REST para gestionar el pipeline de candidaturas. Tu trabajo es construir el frontend que el equipo de People empezará a usar. El sistema debe permitir ver todas las candidaturas de un vistazo, filtrarlas por estado y por etapa, y acceder al detalle de cada una sin perder el contexto del listado.

## Lo que la herramienta debe hacer
- Mostrar todas las candidaturas en un listado — nombre, puesto, estado actual y etapa actual de un vistazo.
- Permitir filtrar por estado y por etapa, y buscar por nombre o email sin recargar la página.
- Abrir la vista de detalle de un candidato y, desde ahí, cambiar su estado o etapa con una sola interacción.
- Añadir notas internas a una candidatura y eliminarlas cuando ya no sean relevantes.
- Registrar nuevas candidaturas directamente desde la interfaz y editar los datos de una cuando haya que corregir algo.

## Notas
La API ya está lista y está documentada en https://playground.4geeks.com/tracker/api/v1/docs. Todas las peticiones deben gestionarse de forma asíncrona — la interfaz debe comunicar los estados de carga y manejar los errores con claridad. El equipo no puede permitirse una herramienta que falle en silencio o que deje al usuario sin saber qué está pasando. Esta es una herramienta interna real que va a usar gente real desde el primer día. Constrúyela como tal.
