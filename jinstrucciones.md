# 🖥️ Qué Debes Hacer

## Backend

- `POST /auth/forgot-password` — acepta `{ email }`. Si el usuario existe, genera un token de restablecimiento con expiración corta (15–60 minutos) y envía un email con el enlace de restablecimiento. Devuelve siempre `200` independientemente de si el email fue encontrado.
- `POST /auth/reset-password` — acepta `{ token, new_password }`. Valida el token (firma, expiración y que no se haya usado ya). Si es válido, hashea la nueva contraseña, actualiza el registro del usuario e invalida el token. Devuelve `400` para tokens inválidos, expirados o ya utilizados.
- `POST /auth/change-password` — acepta `{ current_password, new_password }`. Requiere un token de sesión válido en la cabecera `Authorization`. Verifica la contraseña actual antes de actualizar. Devuelve `400` si la contraseña actual es incorrecta.
- Integra un servicio de correo transaccional para enviar el email de restablecimiento. El email debe incluir el enlace de restablecimiento y ser legible en móvil.
- Almacena la API key del servicio de email en una variable de entorno. Documenta el nombre de la variable en tu `README` o en un `.env.example`.

## Frontend

- `/forgot-password` — formulario con campo de email. Al enviarlo, llama a `POST /auth/forgot-password` y muestra un mensaje de confirmación ("Si esa dirección está registrada, recibirás un enlace en breve"). El formulario debe desactivarse tras el envío para evitar peticiones duplicadas.
- `/reset-password` — formulario de nueva contraseña con campo de confirmación. Lee el `token` del query string de la URL. Al enviarlo, llama a `POST /auth/reset-password`. Si tiene éxito, redirige a `/login` con un mensaje de éxito. Si falla (token expirado o inválido), muestra un error claro y un enlace de vuelta a `/forgot-password`.
- `/account/change-password` — formulario con la contraseña actual, la nueva contraseña y la confirmación. Valida que la nueva contraseña y la confirmación coinciden antes de llamar a la API.
- Añade un enlace “¿Olvidaste tu contraseña?” en la página `/login` que apunte a `/forgot-password`.

## Seguridad

- Los tokens de restablecimiento deben expirar e invalidarse tras su uso — un token no puede usarse dos veces.
- El endpoint `/forgot-password` debe devolver siempre `200`, nunca revelar si un email está registrado.
- Las API keys no deben aparecer nunca en el código fuente — usa exclusivamente variables de entorno.

---

# 🚀 Para ir más lejos (opcional)

No se evalúan, pero son extensiones válidas si el tiempo lo permite:

- **Plantilla de email en HTML** — envía un email con estilos en lugar de un enlace en texto plano.
- **Rate limiting** — limita el número de solicitudes de restablecimiento por dirección de email por hora para prevenir abusos.
- **Registro de auditoría** — registra cada evento de restablecimiento de contraseña (timestamp, dirección IP) en la base de datos.

---

# ✅ Qué Vamos a Evaluar

- `POST /auth/forgot-password` envía un email real con el enlace de restablecimiento cuando se llama con una dirección registrada.
- `POST /auth/forgot-password` devuelve `200` incluso cuando la dirección no está registrada — no se filtra información.
- El token de restablecimiento expira tras la ventana configurada y no puede usarse después de expirar.
- `POST /auth/reset-password` actualiza la contraseña e invalida el token en caso de éxito.
- `POST /auth/reset-password` devuelve `400` para tokens expirados o ya utilizados.
- `/forgot-password` muestra un mensaje de confirmación tras el envío independientemente del resultado.
- `/reset-password` lee el token de la URL, envía el formulario y redirige a `/login` en caso de éxito.
- `/reset-password` muestra un error claro con un enlace de vuelta a `/forgot-password` cuando el token es inválido o ha expirado.
- La página `/login` tiene un enlace visible a "¿Olvidaste tu contraseña?".
- `/account/change-password` valida que la nueva contraseña y la confirmación coinciden, llama a la API y muestra feedback de éxito o error.
- `POST /auth/change-password` rechaza contraseñas actuales incorrectas con `400`.
- Ninguna API key está en el código fuente — todos los secretos se cargan desde variables de entorno.