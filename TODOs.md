## QUE DEBES HACER

### Modelo de usuario y CRUD

- Crear un modelo `User` en TinyDB con al menos:
  - `id`
  - `email`
  - `hashed_password`
  - `is_active`
  - `role`
  - `created_at`
- **No** almacenes nombre visible ni datos de contacto en `User`.
- El campo `role` debe aceptar **únicamente** `admin`, `manager` o `user`.
  - Usa un `Enum` o validador de campo para rechazar cualquier otro valor.
  - Los registros nuevos vía `POST /users` usan `user` por defecto.
- Implementar una capa de servicios con funciones para:
  - crear usuario
  - obtener usuario por ID
  - obtener usuario por email
  - actualizar usuario
  - eliminar usuario
- Exponer servicios como endpoints REST bajo `/users`:
  - **POST /users** — Registrar nuevo usuario
    - Hashear la contraseña **antes** de guardar.
    - Acepta campos opcionales de perfil inicial (`name`, `phone`, `address`).
    - Crea el `Profile` vinculado **en la misma operación**.
  - **GET /users** — Listar todos los usuarios  
    - **Protegida**.
  - **GET /users/{id}** — Obtener usuario por ID  
    - **Protegida**.
  - **PUT /users/{id}** — Actualizar campos de credenciales (`email`, `role`)
    - Solo cuando quien llama es **admin**.
    - **Protegida**.
    - Solo el propio usuario **o** un admin.
  - **DELETE /users/{id}** — Eliminar un usuario
    - **Protegida**.
    - También elimina el perfil vinculado.

### Modelo de perfil y endpoints

- Crear un modelo `Profile` en TinyDB, vinculado **uno a uno** a `User` mediante `user_id`, con al menos:
  - `id`
  - `user_id`
  - `name`
  - `phone`
  - `address`
- Exponer rutas de perfil bajo `/profiles`:
  - **GET /profiles/me** (protegida) — Devuelve el perfil del usuario autenticado.
  - **PUT /profiles/me** (protegida) — Actualiza `name`, `phone` y `address`.  
    - Solo el **dueño** del perfil puede modificarlo.

### Endpoints de autenticación

- Implementar **POST /auth/login**
  - Acepta `email` y `password`.
  - Valida credenciales.
  - Devuelve un token JWT de acceso.
- Implementar **GET /auth/me** (protegida)
  - Devuelve el `email` y `role` del usuario autenticado.
  - Incluye el `Profile` vinculado (nombre y datos de contacto).

### Token y dependencia

- Crear una dependencia `get_current_user` que:
  - Extraiga la cabecera `Authorization: Bearer <token>`.
  - Decodifique y valide el JWT.
  - Recupere el usuario de la base de datos.
  - Lance `HTTPException(401)` si algo falla.
- Configurar la expiración del token mediante una variable de entorno  
  (ej. `ACCESS_TOKEN_EXPIRE_MINUTES`).
- Guardar la clave de firma en `.env`; **nunca** hardcodearla.

### Protección de rutas

- Aplicar `get_current_user` como dependencia a cada ruta que **no** deba ser pública.
  - Como mínimo:
    - Todos los endpoints de `/users` **excepto** `POST /users`
    - `/auth/me`
    - Al menos otras rutas existentes de la API de tu monorepo (fuera de `/users` y `/auth`) que expongan o modifiquen datos sensibles.
- Devolver:
  - `401 Unauthorized` para solicitudes no autenticadas.
  - `403 Forbidden` cuando un usuario intenta acceder a un recurso que no le pertenece.

### Verificación

- Verificar el flujo completo manualmente usando los docs interactivos de FastAPI (`/docs`):
  1. Registro con `POST /users`
  2. Login
  3. Copiar token
  4. Usar el token en una ruta protegida
- Confirmar que llamar a una ruta protegida **sin token** devuelve `401`.
- Confirmar que llamar a una ruta protegida con un token **expirado** o **mal formado** devuelve `401`.

### ⚠️ IMPORTANTE — Restricciones críticas

- **Almacenamiento de User y Profile**
  - Almacena `User` y `Profile` **solo** en TinyDB — ahora y después de añadir Supabase.
  - **No** crees tablas de usuarios ni perfiles en Supabase/SQLModel.
  - Las tablas PostgreSQL de inventario y otros módulos guardan **solo** el `id` de TinyDB como `user_uuid`.

- **Autenticación**
  - **No** uses autenticación basada en sesiones ni en cookies.
  - Este proyecto implementa **únicamente** auth JWT **stateless**.

- **Contraseñas**
  - **Nunca** almacenes contraseñas en texto plano.
  - Usa **libpass** con el esquema **bcrypt** para **todas** las operaciones con contraseñas.
  - Instala `libpass[bcrypt]` — **no** el `passlib` sin mantenimiento.
  - El import de Python sigue siendo:
    ```python
    from passlib.hash import bcrypt