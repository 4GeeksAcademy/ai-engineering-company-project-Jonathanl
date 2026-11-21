# 🖥️ Qué Debes Hacer

## Configuración de bases de datos

- Añade la cadena de conexión PostgreSQL de Supabase a `.env`. Nunca escribas credenciales directamente en el código.
- En `database.py` (o equivalente), inicializa ambas conexiones de base de datos: el cliente TinyDB existente y el nuevo motor SQLModel apuntando a Supabase.
- Crea una dependencia `get_db` que produzca una sesión SQLModel por petición mediante `Depends()`. No uses variables de sesión globales.

## Modelos ORM — `models.py`

- Define la entidad equivalente a producto de tu BRIEFING.md (p. ej. `Ingredient`, `SKU`, `Asset`, `MedicalSupply`) con `SQLModel`, `table=True`, con al menos: `id`, `name`, `sku` y cualquier campo específico de BRIEFING.md.
- Define el modelo equivalente a entrada (p. ej. `IngredientEntry`, `StockEntry`) con: `id`, una FK a la entidad equivalente a producto (`ingredient_id` / `sku_id` / ... según BRIEFING.md), `quantity`, `created_at`, `user_uuid` (cadena — referencia al usuario de TinyDB; sin FK, sin replicación de tabla de usuarios), y cualquier otro campo que BRIEFING.md exija.
- Define el modelo equivalente a salida (p. ej. `IngredientExit`, `StockExit`) con el mismo patrón de FK, más `quantity`, `created_at`, `user_uuid` y los campos que BRIEFING.md exija.
- Llama a `SQLModel.metadata.create_all(engine)` al inicio de la aplicación para inicializar el esquema en Supabase.

## Schemas Pydantic — `schemas.py`

- Define schemas de request y response para las entidades equivalentes a producto, entrada y salida como modelos Pydantic independientes — separados de los modelos ORM. Usa los nombres de BRIEFING.md.
- El schema de respuesta de la entidad equivalente a producto debe incluir un campo `current_stock` (calculado, no almacenado).
- Los modelos ORM y los schemas Pydantic deben estar en archivos separados. Son clases distintas, aunque algunos campos coincidan.

---

## Router de inventario — `routers/inventory.py`

- Crea un `APIRouter` dedicado con `prefix="/inventory"` y regístralo en la aplicación FastAPI principal.
- Implementa los siguientes endpoints dentro de este router:

| Método | Ruta | Descripción |
|----------|----------|----------|
| GET | `/inventory/products` | Lista todos los productos con `current_stock` calculado |
| POST | `/inventory/products` | Crea un producto (requiere autenticación) |
| GET | `/inventory/products/{id}` | Obtiene un producto con su stock actual |
| POST | `/inventory/orders/inbound` | Registra una orden de entrada (requiere autenticación) |
| POST | `/inventory/orders/outbound` | Registra una orden de salida (requiere autenticación) |
| GET | `/inventory/orders` | Lista todas las órdenes con datos del producto y `user_uuid` |

> Auth en GET: las escrituras de producto y órdenes siempre requieren autenticación. Si los GET son públicos o autenticados lo define tu BRIEFING.md (p. ej. HealthCore exige acceso autenticado en las rutas de inventario).

## Reglas de negocio

- `current_stock` se calcula siempre como `SUMA(cantidades de entradas) - SUMA(cantidades de salidas)` para cada entidad equivalente a producto, acotado por cualquier clave de partición que defina tu BRIEFING.md (p. ej. warehouse). Nunca se almacena como una columna que pueda modificarse directamente.
- Una entidad equivalente a producto comienza con stock cero al crearse y solo puede acumular stock a través de registros de entrada.
- Cada endpoint de creación de órdenes requiere autenticación. El UUID del usuario autenticado (de TinyDB) debe almacenarse en el campo `user_uuid` de la orden.
- Un registro de salida que resultaría en stock negativo (dentro del alcance que define BRIEFING.md) debe rechazarse antes de persistir el registro, devolviendo HTTP 400 con un mensaje de error descriptivo.

> ⚠️ IMPORTANTE: Los nombres de entidades, nombres de campos y valores específicos del dominio en tu implementación deben coincidir con lo especificado en tu BRIEFING.md. Una implementación genérica que ignore el contexto no será aceptada.

---

## Datos semilla

- Siembra las tablas de inventario con los registros mínimos listados en tu BRIEFING.md (equivalentes a producto, entradas y salidas) antes de la demo. El stock sembrado debe coincidir con neto entradas − salidas.

---

# ✅ Qué Vamos a Evaluar

- Dos conexiones de base de datos están presentes y se usan correctamente: TinyDB para autenticación y consultas de usuario; Supabase (SQLModel) para todas las entidades de inventario.
- Todos los endpoints de inventario están agrupados bajo `/inventory` mediante un `APIRouter` dedicado.
- Los modelos ORM SQLModel declaran correctamente las relaciones FK: los modelos de entrada/salida referencian la entidad equivalente a producto nombrada en BRIEFING.md (no un `Product` genérico salvo que BRIEFING.md lo diga).
- `current_stock` se calcula a partir de órdenes — ningún endpoint permite modificar directamente un campo de stock en la entidad equivalente a producto.
- El cálculo de stock respeta el alcance de BRIEFING.md (global vs por partición / por warehouse cuando aplique).
- Un registro de salida que supera el stock disponible (dentro de ese alcance) se rechaza con HTTP 400 antes de que ocurra cualquier escritura.
- Cada orden almacena el `user_uuid` del creador autenticado (obtenido de TinyDB).
- Los modelos ORM (`models.py`) y los schemas Pydantic (`schemas.py`) están en archivos separados y son estructuralmente distintos — ningún endpoint devuelve un objeto SQLModel directamente.
- La sesión SQLModel se inyecta por petición mediante `Depends()` — no existe ninguna sesión global en el código.
- Todos los parámetros de conexión están en `.env`; `.env` aparece en `.gitignore`.
- Los nombres de entidades y campos coinciden con la especificación del BRIEFING.md del estudiante.
- Los datos semilla de BRIEFING.md están presentes; `GET /inventory/products` refleja el stock neto de esas semillas.