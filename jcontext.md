# Ticket: AUTH-088 — Cobertura de pruebas unitarias para la API de autenticación

## Contexto: Requerimos pruebas unitarias en todos los endpoints de autenticación antes de fusionar cualquier nuevo cambio.

## Alcance: La batería de pruebas debe cubrir todos los endpoints de la API de autenticación
- Cada endpoint debe tener como mínimo: una prueba de camino feliz, una prueba de caso límite y una prueba de modo de fallo
- Usar pytest para el backend en FastAPI y Jest para la lógica en TypeScript
- Las pruebas deben pasar limpiamente con uv run pytest y jest --coverage
- No probar la serialización HTTP — probar la lógica
- Entregable: Una batería de pruebas funcional incluida junto al código de la API existente, con un TESTING.md breve que explique cómo ejecutarla.