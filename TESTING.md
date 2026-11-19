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
| Lógica auxiliar de seguridad — `get_current_user`, creación y verificación de contraseña/token | Token firmado válido se decodifica para un usuario activo; hash verifica la contraseña original. | Token próximo a expirar y credenciales vacías o de usuario inactivo se consideran explícitamente. | Firma incorrecta, token expirado/mal formado, contraseña incorrecta o hash inválido se rechazan sin propagar errores de la librería. | Estos helpers sustentan los endpoints y concentran las comprobaciones de seguridad. |

Los casos se probarán preferentemente invocando funciones/endpoints con dependencias controladas (dobles de `UserService`, datos y reloj/token cuando corresponda). Se afirmarán resultados de negocio o excepciones previstas, no la serialización HTTP ni el comportamiento interno de FastAPI.

### Suites

- `services/api/tests/test_auth.py`: pruebas de integración preexistentes del flujo de registro, login, identidad actual, permisos y tokens. Usan `TestClient`; no sustituyen a las pruebas unitarias de lógica añadidas para este ticket.
- `services/api/tests/test_register.py`: registro exitoso, asignación del rol público, contraseña hasheada y email duplicado tras normalización.
- `services/api/tests/test_login.py`: inicio exitoso y rechazo de cuenta inexistente, inactiva o contraseña incorrecta.
- `services/api/tests/test_auth_me.py`: devolución de los datos de perfil y error de dominio cuando falta el perfil.
- `services/api/tests/test_token.py`: creación y verificación de hash, resolución de token y rechazo de firma/claims/expiración inválidos, usuario inexistente o inactivo.

### Ejecución y cobertura

Desde la raíz del repositorio, con las dependencias de desarrollo instaladas (`uv sync --extra dev`):

```bash
uv run pytest
```

Para medir la cobertura de los módulos de autenticación (requiere `pytest-cov`):

```bash
uv run --with pytest-cov pytest --cov=services.api.auth --cov=services.api.security --cov=services.api.users --cov=services.api.user_service --cov-report=term-missing
```

Resultado de las nuevas pruebas unitarias: **16 pasaron**. En el alcance de autenticación, `services/api/auth.py` alcanzó **100%** y `services/api/security.py` **85%**, por encima del objetivo mínimo del 70%. `users.py` y `user_service.py` aparecen también en el comando para referencia, pero contienen rutas y reglas de gestión de usuarios ajenas al login/token, por lo que su cobertura parcial no se presenta como cobertura del módulo auth. La batería completa requiere revisión separada: en esta ejecución, 101 pruebas pasaron y una prueba preexistente de incidentes falló (`test_not_found_ids_and_invalid_uuid`) por una discrepancia entre el mensaje de error esperado y el objeto que devuelve la aplicación.

En este entorno no está instalado `uv`; la batería nueva se verificó con `python -m pytest` usando las dependencias instaladas. En un entorno con `uv`, ejecutar los comandos de arriba tal como están documentados.

## TypeScript — Jest

El repositorio contiene utilidades TypeScript en `src/utils/` (validaciones, transformaciones y colecciones), pero no se encontraron helpers de autenticación, configuración de Jest ni dependencias Jest en el proyecto actual. Por tanto, no hay una suite Jest de autenticación identificable para ejecutar en este plan inicial. Si durante la implementación se incorpora lógica TypeScript de autenticación, se añadirá una suite Jest para cada helper con al menos un caso válido y uno de fallo, y se documentará aquí su comando independiente.

## Criterio asistido por IA

Como caso límite a revisar con ayuda de IA se incluye el usuario desactivado: debe rechazarse tanto al iniciar sesión como al validar un token ya emitido, sin revelar si el email existe. También se revisarán tokens firmados válidos pero con `sub` vacío/inválido o sin expiración, casos fáciles de pasar por alto al probar únicamente tokens mal formados.
