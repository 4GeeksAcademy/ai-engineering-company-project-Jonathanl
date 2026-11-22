El equipo de backend completó la API de inventario e hizo el handoff al equipo de producto: todos los endpoints `/inventory` están activos, autenticados y documentados. Ahora el responsable de operaciones ha enviado un brief a la unidad tecnológica: el personal que gestiona el stock a diario necesita una interfaz funcional dentro del backoffice. Mientras no la haya, la API existe pero nadie puede usarla sin un cliente REST.

Tu trabajo es construir la sección de inventario del backoffice: un conjunto de vistas que permitan al personal autenticado consultar el stock disponible, registrar entregas, registrar consumos o salidas y revisar el historial completo de órdenes — todo comunicándose con la API construida en el proyecto de backend.

Esta es una herramienta interna, no una página pública. Las personas que la utilizan son el personal de operaciones, no clientes. Eso condiciona cada decisión: la claridad y la velocidad importan más que el acabado visual de una campaña de marketing. Un responsable de operaciones registrando una entrega a las 7 de la mañana no tiene paciencia para un formulario roto ni para un mensaje de error críptico.

Dos requisitos del brief que es fácil pasar por alto: el formulario de orden de salida debe **mostrar el stock disponible actual del producto seleccionado** antes de que el usuario envíe el formulario, y cualquier respuesta `400` de la API debe mostrar al usuario un **mensaje de error legible** — no un objeto JSON en bruto ni un fallo silencioso.

# Brief del responsable de operaciones

**De:** Responsable de Operaciones  
**Para:** Unidad Tecnológica

El equipo de backend entregó la API de inventario el sprint pasado — buen trabajo. Ahora necesito la interfaz. Mi equipo no puede usar Postman para registrar entregas.

Esto es lo que necesito en el backoffice:

1. Una página que muestre todos los productos con su stock actual. Usa código de color — quiero ver de un vistazo qué está bajo.
2. Un formulario para registrar una orden de entrada (una entrega recibida).
3. Un formulario para registrar una orden de salida (un consumo o salida). Debe mostrar cuánto stock hay disponible antes de que yo envíe, para no registrar más de lo que tenemos.
4. Una página de sólo lectura con todas las órdenes — entradas y salidas — con el nombre del producto y quién creó cada una.

> Todas estas páginas requieren inicio de sesión. Si un usuario no está autenticado, redirígelo a la página de login.

> **Criterios de aceptación:** las cuatro vistas funcionales, autenticadas, consumiendo datos reales de la API, con gestión correcta de errores en fallos de la API.