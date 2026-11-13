# Gestor de Incidencias Centralizado

el equipo de soporte ya no quiere seguir exportando ficheros para analizarlos: quiere registrar incidencias directamente desde el navegador, en tiempo real, desde cualquier punto de la empresa.

Tu tech lead ha decidido dar el siguiente paso: integrar un gestor de incidencias centralizado en la plataforma que lleva construyéndose desde el Hito 5. Cualquier persona de la empresa —esté en una sede operativa, en central o gestionando una incidencia de cliente— podrá registrarla desde un formulario, consultarla y hacer seguimiento desde el mismo panel.

**Nota de tu tech lead:** "Tenemos el histórico en el CSV del proyecto anterior. Vamos a cargarlo como seed de incidencias de cliente para tener datos reales desde el primer día. A partir de ahí, el formulario es la única vía de entrada — nada de ficheros manuales. Y esto tiene que funcionar bien aunque la API tarde, aunque el servidor devuelva un 500, aunque el usuario deje un campo en blanco. Quiero ver mensajes de error que entiendan los usuarios, no stack traces."

## ¿Qué es un gestor de incidencias profesional?

Un gestor de incidencias no es solo un formulario conectado a una base de datos. En un entorno real, cada incidencia tiene un ciclo de vida (abierta → en progreso → resuelta → descartada) y un origen que determina su contexto: no es lo mismo una queja de cliente que un fallo interno detectado por una sede. El sistema debe registrar quién reportó qué, desde dónde, cuándo, y en qué estado se encuentra — y debe poder agregarlo en métricas útiles para la dirección.

## Conocimiento complementario: mejorar un gestor de incidencias con embeddings

Una aplicación como esta — formularios estructurados, filtros y métricas agregadas — funciona muy bien con valores exactos en cada campo. Los embeddings añaden una capa semántica encima: convierten el title y la description de cada incidencia en un vector denso que captura el significado, no solo palabras clave.

Con esa representación almacenada en una base de datos vectorial (o en una extensión que soporte búsqueda por similitud), puedes evolucionar el mismo sistema en varias direcciones sin cambiar el modelo CRUD central:

• Encontrar incidencias similares — al registrar un nuevo reporte, mostrar casos pasados con descripciones parecidas para que soporte reutilice resoluciones o detecte problemas recurrentes.
• Búsqueda más inteligente — consultas como "fallo en el pago en la caja" pueden coincidir con incidencias redactadas de otra forma ("tarjeta rechazada en la compra"), algo que los filtros por palabra clave suelen pasar por alto.
• Detección de duplicados y agrupación — agrupar picos de reportes relacionados entre sedes u orígenes antes de que saturen el panel de resumen.
• Triaje asistido — sugerir categoría o prioridad a partir del texto de la descripción, comparándolo con embeddings de incidencias históricas ya etiquetadas por el equipo.

No hace falta implementar nada de esto en la entrega actual. La idea es ver que el gestor que construyes hoy es una base sólida: cuando las descripciones viven en la base de datos, los embeddings son el siguiente paso natural si el producto necesita búsqueda e inteligencia más allá de los filtros exactos.