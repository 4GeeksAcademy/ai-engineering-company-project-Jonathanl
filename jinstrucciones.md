# 🖥️ Qué debes hacer

## Frontend (Next.js / TypeScript)

- Identifica todas las llamadas fetch o a la API en el frontend y verifica que cada una tenga un bloque try/catch específico para esa llamada.
- Para cada operación asíncrona que cargue datos, implementa el patrón de UI de tres estados: cargando (spinner o skeleton), éxito (datos visibles), error (mensaje con llamada a la acción).
- Reemplaza cualquier mensaje de error en crudo (Error 500, Unexpected token, etc.) por una explicación legible para el usuario.
- Asegúrate de que todo estado de error incluya una llamada a la acción clara: un botón de reintentar, un enlace a la página principal o un prompt para contactar soporte.
- Usa optional chaining (?.) al acceder a propiedades anidadas que podrían ser undefined.
- Añade defaults o fallbacks seguros para valores que podrían ser null o undefined al renderizar.
- Usa bloques finally para asegurar que los estados de carga siempre se limpien, independientemente del resultado.

## Backend (Python / FastAPI)

- Revisa cada handler de ruta y asegúrate de que las excepciones se capturen en el ámbito correcto — evita bloques try/except grandes que engullan todos los errores.
- Devuelve respuestas HTTP de error apropiadas (400, 404, 422, 500) con un cuerpo JSON limpio y estructurado — sin tracebacks de Python en crudo.
- Asegúrate de que las respuestas de error no exponen datos sensibles (cadenas de conexión a base de datos, rutas internas, claves secretas).
- Añade gestión de errores a todas las llamadas a APIs externas que se hagan desde el backend (por ejemplo, llamadas a un LLM o a un servicio de terceros).

## Scripts (Python)

- Envuelve las operaciones de lectura/escritura de archivos y el parseo de CSV en bloques try/except con mensajes de error informativos impresos en stderr.
- Asegúrate de que los scripts terminan con un código distinto de cero (sys.exit(1)) cuando ocurre un error crítico.
- Añade comprobaciones defensivas para datos de entrada faltantes o malformados antes de que comience el procesamiento.

## General

- Revisa el código base en busca de console.error o sentencias print que expongan información interna sensible y elimínalos o reemplázalos.

> ⚠️ **IMPORTANTE:** No introduzcas nuevas funcionalidades ni refactorices código que no esté relacionado con la gestión de errores. El alcance de este proyecto es estrictamente la resiliencia y la comunicación de errores del código existente.

## General

- Revisa el código base en busca de `console.error` o sentencias `print` que expongan información interna sensible y elimínalos o reemplázalos.

> ⚠️ IMPORTANTE: No introduzcas nuevas funcionalidades ni refactorices código que no esté relacionado con la gestión de errores. El alcance de este proyecto es estrictamente la resiliencia y la comunicación de errores del código existente.

---
# ✅ Qué vamos a evaluar

- Todas las operaciones asíncronas del frontend implementan el patrón de UI de tres estados (cargando / éxito / error).
- Los mensajes de error mostrados al usuario son legibles e incluyen una llamada a la acción.
- Los bloques `try/catch` y `try/except` están acotados a operaciones específicas, no envuelven funciones enteras.
- Los bloques `finally` se usan correctamente para limpiar el estado de carga.
- El `optional chaining` y los `fallbacks` se aplican donde corresponde para evitar errores de renderizado por valores `undefined`.
- Las rutas del backend devuelven respuestas de error estructuradas y limpias con los códigos HTTP correctos.
- Ninguna información sensible aparece en la salida de errores entregada al cliente.
- Los scripts de Python gestionan errores de I/O y terminan con códigos de salida apropiados en caso de fallo.

> Nota: La evaluación se centra en la corrección y consistencia de los patrones de gestión de errores — no en si se añadieron nuevas funcionalidades.