# Contexto
Tu tarea es auditar todo el repositorio existente y aplicar una estrategia de gestión de errores consistente en todas las capas: frontend, backend y scripts.

## Lo que necesitamos
- Ningún error debe romper la aplicación ni dejar al usuario en un estado indefinido.
- Toda operación asíncrona en el frontend debe tener tres estados visibles: cargando, éxito y error.
- Los mensajes de error que ve el usuario deben ser legibles — nunca un stack trace, un código de estado o un error de parseo de JSON en crudo.
- Todo estado de error debe ofrecer una salida clara: un botón de reintentar, un enlace a la página principal o instrucciones para contactar soporte.
- En el backend y los scripts, las excepciones deben capturarse en el ámbito correcto — no con un único try/catch que envuelva toda la función.
- Nunca debe aparecer información sensible en la salida de errores enviada al cliente.
Esta es una tarea de ingeniería transversal — no una nueva funcionalidad. El entregable es una versión más limpia y robusta del repositorio que ya has construido. Al terminar este proyecto, cualquier usuario que encuentre un problema en tu plataforma sabrá qué ha pasado y qué puede hacer.
