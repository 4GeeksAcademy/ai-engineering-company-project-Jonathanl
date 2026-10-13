## Plan: Autenticación JWT y protección de rutas

Implementar autenticación JWT stateless en la API FastAPI, con usuarios y perfiles en tablas TinyDB del mismo archivo que proveedores. Proteger todas las rutas de negocio sensibles, mantener público el registro/login, y respetar las reglas de permisos acordadas.

**Pasos**

### Fase 1: Configuración y almacenamiento
1. Validar primero la compatibilidad/mantenimiento de la dependencia indicada para bcrypt (`libpass[bcrypt]`) con el import documentado (`from passlib.hash import bcrypt`). Fijar la dependencia que cumpla el contrato sin recurrir a `passlib` desactualizado. Agregar la librería JWT (`python-jose` con soporte criptográfico).
2. Centralizar configuración para `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES`, cargadas desde variables de entorno/.env. Fallar de forma explícita si falta una clave de firma; no usar secreto por defecto. Añadir `.env.example` sin secretos y excluir `.env` de Git.
3. Ajustar el ciclo de vida de `create_app` para que un único propietario de TinyDB comparta el archivo actual `data/runtime/suppliers.json` entre las tablas `suppliers`, `users` y `profiles`, preservando la inicialización/cierre y la inyección de rutas temporales en pruebas. Evitar abrir instancias TinyDB independientes sobre el mismo archivo.

### Fase 2: Modelos y servicios
4. Definir modelos de dominio/entrada/salida para User y Profile. User contiene id UUID, email único, hashed_password, is_active, role limitado a admin/manager/user y created_at; nunca nombre/contacto. Profile contiene id, user_id único, name, phone y address. Aplicar esquemas de salida que nunca expongan hashed_password y validación estricta de campos.
5. Implementar stores TinyDB y una capa de servicios con operaciones de usuario por ID/email, alta, actualización y borrado, más lectura/actualización de perfil. Normalizar y hacer único el email. Crear siempre el Profile durante registro aunque falten campos opcionales. Coordinar ambas escrituras como una operación y evitar usuarios/perfiles huérfanos ante fallo; eliminar el perfil al borrar su usuario.

### Fase 3: Seguridad, autenticación y autorización
6. Implementar hash/verificación bcrypt, emisión y validación JWT con expiración configurable y el id TinyDB del usuario como subject/claim. Configurar `OAuth2PasswordBearer` con token URL `/auth/login`; implementar `get_current_user` para validar token, buscar el usuario y rechazar tokens inválidos, expirados, de usuarios inexistentes o inactivos con 401.
7. Añadir routers y endpoints:
   - `POST /auth/login`: formulario OAuth2 (`username` contiene el email, más password); devuelve access token.
   - `GET /auth/me`: protegido; email, role y Profile vinculado.
   - `POST /users`: público; crea usuario con role=user forzado, hashea password y acepta name/phone/address opcionales para el Profile.
   - `GET /users`: solo admin; `GET /users/{id}`: propio usuario o admin.
   - `PUT /users/{id}`: el dueño puede cambiar email; admin puede cambiar email y role. Nunca acepta contraseñas en esta ruta.
   - `DELETE /users/{id}`: solo admin; elimina Profile y bloquea el borrado si dejaría cero admins activos.
   - `GET /profiles/me` y `PUT /profiles/me`: protegidos; solo el dueño accede y actualiza name/phone/address.
8. Crear un comando explícito de bootstrap de admin usando email/password desde entorno; no crear admins automáticamente al arrancar la API. Hacerlo seguro ante ejecuciones repetidas y almacenar solo el hash.

### Fase 4: Protección de API existente
9. Aplicar `get_current_user` a todos los endpoints de proveedores (`GET/POST /api/suppliers`, `GET/PATCH /api/suppliers/{id}`) y de incidencias (`POST /api/incidents/analyze`, `GET /api/incidents/results/export`). Dejar públicos registro, login, documentación interactiva y recursos estáticos; las páginas pueden cargar, pero sus llamadas de negocio requieren Bearer token.
10. Mantener el resto de reglas existentes de negocio, exportación y persistencia. No crear tablas Supabase/SQLModel para usuarios/perfiles ni usar sesiones/cookies.

### Fase 5: Pruebas y documentación
11. Añadir pruebas de modelos/servicios y API: hash nunca reversible ni expuesto, rol inválido/autoasignación rechazada, email único, relación uno-a-uno, perfil creado/eliminado junto al usuario, persistencia al reiniciar, y bootstrap de admin.
12. Probar matriz de permisos para cada ruta: acceso permitido/denegado por rol y propiedad; respuestas 401 sin token, con token mal formado/expirado y con usuario inactivo/eliminado; 403 cuando un usuario autenticado intenta acceder a un recurso de otro. Comprobar el bloqueo de borrado del último admin.
13. Actualizar pruebas existentes de proveedores/incidencias para autenticar sus solicitudes. Ejecutar `uv sync --extra dev` y `uv run pytest services/api/tests`; después verificar manualmente en `/docs`: registro, login OAuth2, uso del token en ruta protegida y `/auth/me`.
14. Documentar variables de entorno, bootstrap inicial, endpoints, permisos y flujo local de verificación en `services/api/README.md`.

**Archivos relevantes**
- `Autenticacion.md` y `TODOs.md` — requerimientos funcionales y restricciones.
- `services/api/app.py` — fábrica `create_app`, lifespan, registro de routers y rutas de incidencias.
- `services/api/supplier_store.py` — patrón actual TinyDB que deberá adaptarse al acceso compartido.
- `services/api/suppliers.py` y `services/api/supplier_models.py` — dependencias, router y patrón de validación/salida.
- `services/api/seed.py` — patrón para el comando de inicialización existente.
- `services/api/tests/test_suppliers.py` — fixture `create_app` con `tmp_path`, TestClient, persistencia y pruebas API que deberán actualizarse.
- `pyproject.toml`, `.gitignore`, `services/api/README.md` — dependencias/CLI, protección de secretos y documentación.
- Nuevos módulos previstos: `services/api/settings.py`, `database.py`, `user_models.py`, `user_store.py`, `user_service.py`, `security.py`, `auth.py`, `users.py`, `profiles.py`, `seed_admin.py` y pruebas de autenticación en `services/api/tests/test_auth.py`.

**Verificación**
1. Ejecutar `uv sync --extra dev` y `uv run pytest services/api/tests`.
2. Verificar con tests que todas las rutas privadas responden 401 sin token y para token inválido/expirado; que permisos/propiedad producen 403 según matriz acordada.
3. Confirmar pruebas de persistencia TinyDB, unicidad, integridad User-Profile, hash bcrypt, expiración y ausencia de hashed_password en cualquier respuesta.
4. Seguir el flujo manual en `/docs`: registrar user, autorizar con formulario OAuth2 usando email como `username`, y llamar `/auth/me` y rutas protegidas.
5. Revisar que `.env` no esté versionado, que `.env.example` no contenga secretos y que el bootstrap no se ejecute al iniciar el servidor.

**Decisiones**
- Registro/login públicos; todos los endpoints actuales de proveedores e incidencias protegidos.
- PUT usuario: dueño cambia email; solo admin cambia role; admin puede cambiar ambos. GET list y DELETE son admin-only; detalle es self/admin.
- `manager` no recibe permisos especiales en esta fase.
- POST /users fuerza `role=user`; primer admin se crea mediante comando explícito con credenciales de entorno, no durante el arranque.
- TinyDB compartido en el archivo actual, con tablas separadas. Profile se crea siempre y los tres campos son opcionales.
- Login usa OAuth2 form, campo `username` con el email. Access token incluye id TinyDB y expiración desde entorno.
- No se implementa cambio de contraseña; PUT /users no acepta password. DELETE no puede dejar cero admins activos.
- Usuarios/perfiles no pasan a Supabase/SQLModel; no se usan sesiones ni cookies. La UI no incorpora login en esta fase.
- La dependencia bcrypt se fija solo tras validar el conflicto entre nombre de paquete y API de import que indican los documentos.

**Límites**
- No añadir interfaz de login ni cambios de UX fuera del flujo manual en `/docs`.
- No modificar el modelo ni la persistencia de proveedores más allá de compartir correctamente TinyDB y ajustar sus pruebas para autenticación.
- No añadir recuperación de contraseña, refresh tokens ni permisos especiales para manager sin requisitos nuevos.
