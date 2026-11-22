# 💻 Qué Debes Hacer

## Capa de integración con la API

- Crea un módulo (p. ej., `lib/inventory.ts`) que centralice todas las llamadas a los endpoints `/inventory`. Ningún componente debe llamar a `fetch` directamente.
- Todas las peticiones a endpoints protegidos deben incluir la cabecera `Authorization: Bearer <token>`. Lee el token de donde tu sistema de auth existente lo almacena (localStorage, contexto, cookie).
- Gestiona los errores de la API de forma explícita: si el estado de la respuesta es `4xx` o `5xx`, extrae el mensaje de error del cuerpo de la respuesta y muéstraselo al usuario — nunca ignores los errores en silencio.

## Página de productos — `/backoffice/inventory/products`

- Obtén y muestra todos los productos desde `GET /inventory/products`.
- Muestra el valor de `current_stock` para cada producto junto con los campos específicos de entidad definidos en `bd-nexova-BRIEFING.es`.
- Aplica indicadores visuales de nivel de stock: usa color o iconografía para distinguir el stock saludable del stock bajo. Define tus propios umbrales — documéntalos en un comentario.
- Incluye un enlace o botón claramente etiquetado en cada fila de producto para crear una orden de entrada o de salida para ese producto.

## Formulario de orden de entrada — `/backoffice/inventory/orders/inbound`

- Renderiza un formulario que envíe datos a `POST /inventory/orders/inbound`.
- El selector de producto debe listar todos los productos disponibles por nombre. No pidas al usuario que escriba un ID en bruto.
- Tras un envío exitoso, limpia el formulario y muestra un mensaje de confirmación. Ante un `400 / 500`, muestra el mensaje de error de la API en un elemento visible — no solo en la consola.
- El formulario debe estar protegido: redirige a los usuarios no autenticados a la página de login.

---

## Formulario de orden de salida — `/backoffice/inventory/orders/outbound`

- Renderiza un formulario que envíe datos a `POST /inventory/orders/outbound`.
- Cuando el usuario selecciona un producto, obtén y muestra su `current_stock` antes de que introduzca una cantidad. Esto debe actualizarse de forma reactiva cuando cambia la selección de producto.
- Si la cantidad introducida supera el stock mostrado, muestra una advertencia en el cliente antes de que el usuario envíe. Esto es una salvaguarda de UX — la API aplica la regla real.
- Gestiona el `HTTP 400` de la API (stock insuficiente) mostrando el mensaje de error inline junto al campo de cantidad.

## Página de historial de órdenes — `/backoffice/inventory/orders`

- Obtén y muestra todas las órdenes desde `GET /inventory/orders`.
- Cada fila debe mostrar: nombre del producto, cantidad, tipo de orden (entrada o salida), fecha de creación y el `user_uuid` que la creó.
- Muestra las órdenes de entrada y de salida con una distinción visual (p. ej., color, icono o etiqueta).
- Esta página es de sólo lectura. Sin acciones de borrado ni edición.

## Protección de rutas

- Las cuatro páginas de inventario deben redirigir a los usuarios no autenticados a la página de login. Usa el mismo patrón de comprobación de auth ya presente en el backoffice.

> ⚠️ IMPORTANTE: Los nombres de entidades, etiquetas de campos y el vocabulario de la interfaz deben coincidir con lo especificado en `bd-nexova-BRIEFING.es` — usa el lenguaje de dominio de tu empresa, no los términos genéricos de este README.

---

# ✅ Qué Vamos a Evaluar

- Existe un módulo de integración con la API dedicado — no hay llamadas `fetch` directas dentro de los componentes.
- Todas las peticiones a endpoints protegidos incluyen la cabecera `Authorization` con el token del usuario actual.
- La página de productos carga datos reales de la API y muestra `current_stock` con indicadores visuales de nivel de stock.
- El formulario de orden de entrada envía correctamente y muestra una confirmación o un mensaje de error legible en cada resultado — sin fallos silenciosos.
- El formulario de orden de salida muestra el stock actual del producto seleccionado de forma reactiva, antes de que el usuario envíe.
- El formulario de orden de salida muestra una advertencia en el cliente cuando la cantidad introducida supera el stock disponible.
- Una respuesta `400` del endpoint de salida muestra el mensaje de error de la API de forma visible en la interfaz.
- La página de historial de órdenes muestra todas las órdenes con distinción entrada/salida, nombre de producto, cantidad, fecha y `user_uuid`.
- Las cuatro páginas redirigen a los usuarios no autenticados al login.
- Los nombres de entidades y etiquetas de campos en la interfaz coinciden con la especificación de `bd-nexova-BRIEFING.es`.