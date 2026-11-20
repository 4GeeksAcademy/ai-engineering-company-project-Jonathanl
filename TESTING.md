# Plan y ejecución de pruebas

Este documento registra primero los casos planificados antes de implementar la batería. Las pruebas de autenticación se enfocarán en las decisiones de negocio de los endpoints y servicios (usuarios, credenciales, perfiles y tokens); no comprobarán el formato del JSON, encabezados de transporte ni otros detalles de serialización HTTP.

## Backend — FastAPI y pytest

### Alcance y casos previstos

Los endpoints de autenticación presentes en el proyecto son `POST /auth/login` y `GET /auth/me`. El alta pública de usuarios está implementada en `POST /users` y forma parte del flujo de autenticación, por lo que también se incluye.

| Endpoint / lógica | Camino feliz | Caso límite | Modo de fallo | Motivo |
| --- | --- | --- | --- | --- |
| `POST /users` — registro | Con datos válidos crea un usuario de rol `user`, normaliza el email y almacena la contraseña hasheada. | El email con mayúsculas o espacios exteriores se normaliza; un email ya registrado (incluida una variante de mayúsculas) no crea otro usuario. | Datos de creación inválidos o duplicidad producen el error de dominio esperado; se comprueba que la contraseña no se almacena en texto plano. | Evita duplicados y asignaciones de privilegios no autorizadas, y protege credenciales. |
| `POST /auth/login` — inicio de sesión | Usuario activo y contraseña correcta producen un token cuyo sujeto identifica al usuario. | Usuario inactivo o cuenta inexistente se rechazan sin filtrar cuál de los datos falló. | Contraseña incorrecta se rechaza; no se genera token. | Cubre autenticación válida y respuestas seguras ante credenciales inválidas. |
| `GET /auth/me` — identidad actual | Usuario autenticado con perfil obtiene sus datos de identidad, rol y perfil. | Perfil ausente para un usuario válido produce el error específico de perfil no encontrado. | Token inválido, mal formado, expirado, con claims incompletos o asociado a usuario inexistente/inactivo se rechaza. | Verifica autorización, expiración y consistencia entre cuenta y perfil. |
| `POST /users` y reglas de `UserService` — alta/gestión de usuarios | Alta normal y actualización autorizada conservan perfil y credenciales correctamente. | Actualización de email de un administrador sin cambiar su rol; usuario/perfil no encontrado y varios administradores activos. | Email duplicado, modificación no autorizada de otro usuario/rol, eliminación o degradación del último admin y fallos al guardar/eliminar perfil. | Al incluir `users.py` en el objetivo de cobertura, hay que cubrir también sus ramas de autorización y las invariantes transaccionales del servicio. |
| Lógica auxiliar de seguridad — `get_current_user`, creación y verificación de contraseña/token | Token firmado válido se decodifica para un usuario activo; hash verifica la contraseña original. | Token próximo a expirar y credenciales vacías o de usuario inactivo se consideran explícitamente. | Firma incorrecta, token expirado/mal formado, contraseña incorrecta o hash inválido se rechazan sin propagar errores de la librería. | Estos helpers sustentan los endpoints y concentran las comprobaciones de seguridad. |
| `GET /api/incidents/{incident_id}` — búsqueda de incidencia | Un identificador existente recupera la incidencia. | UUID válido sin registro asociado produce 404 y el error de dominio identifica el campo `id` junto al mensaje esperado. | Identificador mal formado produce 400 con el campo `id`. | Mantiene las aserciones de prueba alineadas con el contrato documentado de errores `{field, message}`. |

Los casos se probarán preferentemente invocando funciones/endpoints con dependencias controladas (dobles de `UserService`, datos y reloj/token cuando corresponda). Se afirmarán resultados de negocio o excepciones previstas, no la serialización HTTP ni el comportamiento interno de FastAPI.

### Suites

- `services/api/tests/test_auth.py`: pruebas de integración preexistentes del flujo de registro, login, identidad actual, permisos y tokens. Usan `TestClient`; no sustituyen a las pruebas unitarias de lógica añadidas para este ticket.
- `services/api/tests/test_register.py`: registro exitoso, asignación del rol público, contraseña hasheada y email duplicado tras normalización.
- `services/api/tests/test_login.py`: inicio exitoso y rechazo de cuenta inexistente, inactiva o contraseña incorrecta.
- `services/api/tests/test_auth_me.py`: devolución de los datos de perfil y error de dominio cuando falta el perfil.
- `services/api/tests/test_token.py`: creación y verificación de hash, resolución de token y rechazo de firma/claims/expiración inválidos, usuario inexistente o inactivo.
- `services/api/tests/test_user_routes.py` (por añadir): invocación directa de las funciones de rutas de usuarios para ramas de éxito, usuario inexistente, acceso ajeno, cambio de rol, duplicado, último administrador y eliminación; no usará cliente HTTP.
- `services/api/tests/test_users.py`: reglas de servicio/almacén existentes; ampliar con email/rol de administrador, usuario inexistente y rollback de eliminación si falla la baja del perfil.
- `services/api/tests/test_incident_routes.py`: para la búsqueda de incidentes se afirma el contrato de negocio del error de recurso inexistente (`field` y `message`) y el rechazo de UUID inválido; se corrige una aserción antigua que esperaba otro formato.

Revisión asistida por IA: al contrastar los casos con las ramas de validación se añadieron dos pruebas que faltaban: el límite de contraseña vacía al crear `UserCreate` y el rechazo controlado de un hash mal formado por `verify_password`. Las dos suites modificadas pasaron (12 pruebas); no se detectó un bug en el código de producción, por lo que no fue necesario cambiarlo.

### Ejecución y cobertura

Desde la raíz del repositorio, con las dependencias de desarrollo instaladas (`uv sync --extra dev`):

```bash
uv run pytest
```

Para medir la cobertura de los módulos de autenticación (requiere `pytest-cov`):

```bash
uv run --with pytest-cov pytest --cov=services.api.auth --cov=services.api.security --cov=services.api.users --cov=services.api.user_service --cov-report=term-missing
```

La última ejecución completa con cobertura pasó **112 pruebas**. Cobertura medida: `auth.py` **100%**, `security.py` **100%**, `users.py` **100%** y `user_service.py` **99%** (**99%** total del conjunto seleccionado), todos por encima del objetivo mínimo del 70%. Las pruebas directas añadidas a `test_user_routes.py` cubren ramas de acceso/propiedad, cambios de roles, conflictos, registros ausentes y protección del último administrador; `test_users.py` cubre invariantes del servicio y rollback de escritura/borrado.

Suite completa tras alinear la aserción de `test_not_found_ids_and_invalid_uuid` con el contrato `{field, message}`: **`uv run pytest` pasó con 112 pruebas aprobadas y 0 fallos**. `uv` 0.13.9 creó el entorno del proyecto e instaló las dependencias declaradas. Se emitió un warning de deprecación de `starlette.testclient`/`httpx`; no afecta el resultado.

En este entorno está instalado **uv 0.13.9**. La suite completa y el comando documentado `uv run pytest` se ejecutaron desde la raíz del repositorio; ambos terminaron con **112 pruebas aprobadas y 0 fallos**. Para cobertura se usó `uv run --with pytest-cov pytest ...`; `pytest-cov` se provisiona para ese comando sin modificar las dependencias base del proyecto.

## Frontend — Jest (FE-019)

Las pruebas están en `uis/talent-pipeline/__tests__/` y cubren tres utilidades del frontend Next.js:

- `domain.test.ts`: `getInitials` con nombre normal y vacío; `formatCandidateDate` con fecha válida e inválida.
- `api.test.ts`: `getCandidate` con un payload válido y con una respuesta de forma inválida.

Ejecutar independientemente desde el directorio del frontend:

```bash
cd uis/talent-pipeline
npm install
npm test
```

`npm test` ejecuta `jest --coverage`. Último resultado: **2 suites y 6 pruebas aprobadas**. La cobertura global de los archivos incluidos (`domain.ts` y `api.ts`) fue 43.02% de statements; `domain.ts` tuvo 100% y `api.ts` 35.52%. La cobertura de `api.ts` es parcial porque se prueban únicamente las rutas de `getCandidate` incluidas en FE-019.

Una prueba con espacios al inicio y final del nombre detectó un defecto: `getInitials` devolvía solo la primera inicial cuando la cadena empezaba con espacios. Se corrigió recortando el nombre antes de dividirlo. La prueba y la suite completa de Jest pasan tras el cambio.

## Criterio asistido por IA

Como caso límite a revisar con ayuda de IA se incluye el usuario desactivado: debe rechazarse tanto al iniciar sesión como al validar un token ya emitido, sin revelar si el email existe. También se revisarán tokens firmados válidos pero con `sub` vacío/inválido o sin expiración, casos fáciles de pasar por alto al probar únicamente tokens mal formados.
