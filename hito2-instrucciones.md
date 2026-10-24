
## 1. Lo Que Debes Hacer

Implementa las siguientes funcionalidades en TypeScript. Todos los nombres de entidades, campos y reglas deben coincidir exactamente con lo especificado en tu nexova-BRIEFING.md.

### 1.1 Backend / Lógica

- Define las interfaces TypeScript para todas las entidades principales de tu empresa especificadas en tu nexova-BRIEFING.md.
- Implementa funciones de filtrado que permitan buscar elementos por uno o más criterios (por ejemplo: filtrar por categoría, por rango de precio, por estado).
- Implementa funciones de ordenamiento que ordenen arrays según diferentes criterios (ascendente, descendente, por múltiples campos).
- Implementa búsqueda lineal para encontrar elementos en arrays desordenados.
- Implementa búsqueda binaria para encontrar elementos en arrays previamente ordenados.
- Crea funciones de agregación que generen reportes: contar elementos por categoría, calcular totales, promedios, máximos y mínimos.
- Implementa validaciones de negocio que verifiquen que los objetos cumplen con las reglas de tu nexova-BRIEFING.md antes de ser procesados.
- Todas las funciones deben tener tipos explícitos en parámetros y valores de retorno.
- El código debe seguir el principio de responsabilidad única: cada función hace una sola cosa.
- El proyecto incluye un comando claro para validar o ejecutar el código TypeScript durante el desarrollo.

> ⚠️ **IMPORTANTE:** Los nombres de campos, tipos de entidades y reglas de validación en tu implementación deben coincidir exactamente con lo especificado en tu nexova-BRIEFING.md. Una implementación genérica que ignore el contexto no será aceptada.

### 1.2 Frontend / Pruebas (Opcional)

- Crea una página HTML simple con Tailwind CSS que te permita probar tus funciones manualmente.
- Incluye botones o controles para ejecutar diferentes operaciones (filtrar, buscar, ordenar, generar reportes).
- Muestra los resultados de las operaciones en la interfaz de forma clara.

Si agregas una página `index.html` para probar tus funciones manualmente, asegúrate de poder servirla en local o en Codespaces con un comando simple como:

```bash
npx http-server . -p 3000 -a 0.0.0.0
```

---

## 1.3 Calidad de Código

- Usa nombres descriptivos para variables, funciones e interfaces (`camelCase` para variables y funciones, `PascalCase` para interfaces).
- Cada función debe ser pura: trabaja solo con lo que recibe por parámetros, sin modificar variables globales.
- Escribe comentarios solo cuando sea necesario para explicar lógica compleja, no para describir código obvio.
- Maneja correctamente casos vacíos: arrays vacíos, elementos no encontrados, valores nulos.
- Usa `const` por defecto y `let` solo cuando el valor vaya a cambiar.
- Mantén la indentación y el formato consistentes en todo el código.

---

## 2 Lo Que Evaluaremos

### 2.1 Corrección Técnica

- Las interfaces TypeScript modelan correctamente las entidades especificadas en el nexova-BRIEFING.md con todos sus campos y tipos.
- Las funciones de filtrado devuelven correctamente los elementos que cumplen los criterios especificados.
- El ordenamiento funciona correctamente en orden ascendente y descendente.
- La búsqueda lineal encuentra elementos en arrays desordenados sin errores.
- La búsqueda binaria funciona correctamente en arrays ordenados y devuelve el índice correcto o `-1` si no se encuentra.
- Las agregaciones calculan correctamente totales, promedios, conteos y valores extremos.
- Las validaciones rechazan datos que no cumplen con las reglas de negocio del nexova-BRIEFING.md.
- No hay errores de compilación de TypeScript en ningún archivo.
- Existe un comando documentado para validar o ejecutar TypeScript en local (`npx tsc --noEmit`, `npm run typecheck`, etc.).

### 2.2 Estructura y Organización

- El código está organizado en archivos separados por responsabilidad (`types`, `utils`, `validations`).
- Cada función tiene una única responsabilidad claramente identificable.
- Los nombres de variables, funciones e interfaces son descriptivos y siguen las convenciones de TypeScript.

### 2.3 Adaptación al Contexto

- Todos los nombres de entidades, campos y tipos coinciden exactamente con los especificados en el nexova-BRIEFING.md.
- Las validaciones implementadas corresponden a las reglas de negocio definidas en el nexova-BRIEFING.md.
- Los reportes generados responden a las necesidades específicas descritas en el nexova-BRIEFING.md.

### 2.4 Calidad de Código

- Las funciones son puras: no dependen de variables externas ni modifican estado global.
- Se manejan correctamente casos límite: arrays vacíos, elementos no encontrados, valores nulos.
- El código sigue las mejores prácticas de TypeScript: tipos explícitos, uso apropiado de `const` y `let`, y evita el uso de `any`.

