
La API de tu empresa está creciendo. Has construido endpoints que sirven datos al frontend, consultan la base de datos y procesan registros — pero en este momento, cualquier persona que conozca una URL puede llamarlos. Antes de que la plataforma pase a su siguiente fase, la CTO ha sido clara: ninguna ruta que modifique o exponga datos sensibles debe ser accesible sin una sesión válida.
## AUTH-01 — Implementar autenticación y protección de rutas

AUTH-01 — Implementar autenticación y protección de rutas
La API actualmente no tiene capa de autenticación. Esta tarea incluye:
•	Un módulo users con CRUD completo (crear, leer, actualizar, eliminar) solo para credenciales — email y contraseña.
•	Un módulo profiles con enlace uno a uno a cada usuario — el nombre visible y los datos de contacto viven en Profile, no en User.
•	Un endpoint de login que valide credenciales y devuelva un token JWT firmado.
•	Una dependencia reutilizable get_current_user que decodifique el token e identifique al usuario.
•	Aplicación de esa dependencia a todas las rutas que no deben ser de acceso público.
Almacena User y Profile solo en TinyDB — El JWT debe llevar el id del usuario en TinyDB; otros módulos lo referencian como user_uuid.
Usa OAuth2PasswordBearer de FastAPI y python-jose para la firma del token. Las contraseñas deben estar hasheadas — nunca almacenadas ni comparadas en texto plano. El token debe llevar como mínimo el ID del usuario y expirar tras una ventana configurable.
Todas las rutas relacionadas con autenticación deben vivir bajo /auth. Las rutas de gestión de usuarios bajo /users. Las rutas de perfil bajo /profiles.

## Conocimient complementario:
Si no has implementado auth con JWT antes, este es el modelo mental: cuando un usuario hace login, el servidor firma un pequeño payload JSON (los "claims") usando una clave secreta y devuelve el resultado como una cadena de token. En las solicitudes siguientes, el cliente envía ese token en la cabecera Authorization. El servidor lo decodifica — si la firma es válida y el token no ha expirado, la solicitud continúa; si no, recibe un 401.
En FastAPI, este flujo se implementa como una dependencia. Escribes una función que extrae el token de la solicitud, lo valida y devuelve el objeto usuario. Cualquier ruta que declare esa función como dependencia requerirá autenticación automáticamente.
