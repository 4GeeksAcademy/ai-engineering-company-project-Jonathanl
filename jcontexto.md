# Hito — Backend: Gestión de Inventario con ORM y Doble Base de Datos

Antes de empezar: Lee tu `bd-nexova-BRIEFING.es.md` antes de escribir ningún código — define las entidades específicas, los nombres de campos y las restricciones de negocio para tu implementación.

---

# 🎯 Tu reto
la empresa necesita un sistema centralizado de gestión de inventario.
Ya has construido — o se espera que tengas — la API y la capa de autenticación bajo `services/`. Si FastAPI + auth TinyDB (`User / get_current_user`) aún no está en tu monorepo, completa los proyectos de autenticación (o monta esa capa) antes de empezar este hito: aquí extiendes ese servicio; no creas uno nuevo desde cero.

la autenticación permanece en TinyDB (búsquedas rápidas, locales y basadas en documentos), y todos los datos de negocio — productos, órdenes de entrada y órdenes de salida — se mueven a Supabase (una base de datos PostgreSQL alojada en la nube). Tu aplicación FastAPI mantendrá dos conexiones de base de datos simultáneas y deberá usarlas de forma deliberada: cada petición llega al almacén correcto.

Esto no es solo un ejercicio de persistencia. El equipo de operaciones incluyó una restricción no negociable en el brief:

> "Los niveles de stock no se pueden modificar directamente. La única forma de cambiar el inventario es registrando una orden — ya sea una orden de entrada que añade stock, o una orden de salida que lo reduce. Cada orden debe ser trazable al usuario que la creó."
Todos los endpoints de inventario deben agruparse bajo el prefijo de router /inventory.
---

# ¿Qué es un ORM y por qué importa aquí?

Un ORM (Object-Relational Mapper) es una capa de traducción: una clase Python se convierte en una tabla, una instancia en una fila y un atributo en una columna. No reemplaza conocer SQL — entender lo que el ORM genera por debajo es lo que te permite usarlo correctamente y depurar errores cuando algo falla.

En este hito usarás SQLModel, que combina el motor ORM de SQLAlchemy con el sistema de tipos de Pydantic. No uses SQLAlchemy directamente.

Antes de escribir cualquier consulta, debes conocer el problema N+1. Si cargas una lista de órdenes y después accedes a los datos del producto de cada una dentro de un bucle, generas una consulta adicional por elemento — degradando el rendimiento de forma silenciosa. Estructura tus consultas para cargar los datos relacionados desde el inicio, no en el momento del acceso.

---

# Brief de tu tech lead

**De:** Tech Lead  
**Asunto:** Hito — arquitectura de doble base de datos + ORM de inventario
 Esto es lo que debe hacer el sistema:

1. La aplicación FastAPI conecta a dos bases de datos simultáneamente: TinyDB (existente, para usuarios y autenticación) y Supabase (nueva, para inventario y órdenes).

2. Los productos y el stock viven en Supabase. El stock no debe ser una columna editable directamente — siempre se deriva del historial de órdenes.

3. Las órdenes de entrada incrementan el stock; las órdenes de salida lo reducen. Ambas se almacenan en Supabase y referencian el UUID del usuario de TinyDB — ninguna tabla de usuarios se replica en Supabase.

4. Los modelos ORM usan SQLModel. Los schemas Pydantic para request y response están en un archivo separado de los modelos ORM — nunca devuelvas un objeto ORM directamente desde un endpoint.

5. Todas las rutas de inventario deben registrarse bajo el prefijo `/inventory` usando un `APIRouter` dedicado.

6. Revisa tu BRIEFING.md — los nombres de entidades, las restricciones de campos y las reglas de negocio son específicas de tu empresa.

> **Criterios de aceptación:** todos los endpoints funcionales bajo `/inventory`, relaciones FK aplicadas a nivel de base de datos, sin mutación directa de stock, ambas conexiones activas y usadas correctamente.