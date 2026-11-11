# AUTH-03 — Recuperación y cambio de contraseña

La plataforma necesita dos mecanismos de contraseña — restablecimiento cuando el usuario la olvidó, y cambio estando conectado. Esto cubre tanto la API como el frontend:

## Backend:

1. POST `/auth/forgot-password` — recibe un email, valida que el usuario existe, genera un token de restablecimiento firmado de corta duración y envía un enlace de restablecimiento a la dirección del usuario.

2. POST `/auth/reset-password` — recibe el token de restablecimiento y una nueva contraseña, valida el token (firma + expiración), hashea la nueva contraseña y actualiza el registro del usuario. El token debe quedar invalidado tras su uso.

3. POST `/auth/change-password` — endpoint autenticado. Recibe la contraseña actual y una nueva, verifica la actual, hashea la nueva y actualiza el registro del usuario.

## Frontend:

1. `/forgot-password` — formulario donde el usuario introduce su email. Siempre muestra un mensaje de confirmación tras el envío, independientemente de si la dirección existe, para evitar la enumeración de usuarios.

2. `/reset-password` — formulario donde el usuario establece una nueva contraseña. Lee el token de restablecimiento del query string de la URL y lo envía a la API junto con la nueva contraseña. Si tiene éxito, redirige a `/login`.

3. `/account/change-password` — formulario con la contraseña actual, la nueva contraseña y la confirmación. Valida que la nueva contraseña y la confirmación coinciden antes de llamar a la API.

Para el envío de correos, elige uno de los siguientes servicios e intégralo:

1. Resend
2. SendGrid (Twilio)

## ¿Por qué solo estos dos?

Para este ejercicio, **Resend** y **SendGrid** son las opciones prácticas: puedes completar el flujo en desarrollo **sin un dominio propio** (Resend con su remitente de onboarding; SendGrid en trial/sandbox o con un remitente único verificado — revisa su documentación actual). Alternativas como Mailgun o MailerSend suelen exigir **verificar tu propio dominio en DNS** antes de enviar a destinatarios arbitrarios, lo que bloquea a muchos estudiantes durante el proyecto.

Ambos ofrecen un tier gratuito suficiente para desarrollo. Las API keys deben almacenarse en variables de entorno — nunca en el código fuente.

## Conocimiento complementario: cómo funciona un flujo de restablecimiento de contraseña

El flujo tiene tres pasos y dos momentos separados en el tiempo:

1. **Solicitud** — el usuario envía su email. El servidor genera un token de restablecimiento (un JWT firmado o una cadena aleatoria almacenada en la base de datos), construye una URL de restablecimiento que contiene ese token (`/reset-password?token=<token>`) y la envía al email del usuario mediante un servicio de correo transaccional.

2. **Restablecimiento** — el usuario hace clic en el enlace, llega a la página `/reset-password`, introduce una nueva contraseña y envía el formulario. El frontend envía el token (leído de la URL) y la nueva contraseña a la API. El servidor valida el token (firma, expiración **y que no se haya usado ya**), actualiza la contraseña e invalida el token para que no pueda reutilizarse.

3. **Confirmación** — el usuario es redirigido a `/login` y puede iniciar sesión con la nueva contraseña.

## ¿Por qué mostrar siempre un mensaje de confirmación?

Si el formulario muestra "email no encontrado" para direcciones que no existen, un atacante puede usar eso para enumerar qué emails están registrados. Responder siempre con "si esa dirección está en nuestro sistema, recibirás un enlace" lo evita.

## Expiración y reutilización

Un token de restablecimiento debe durar 15–60 minutos y quedar inutilizable tras un reset exitoso. Un JWT con solo un claim `exp` no se puede invalidar después de usarlo. Persiste estado en el servidor: una fila con el token hasheado, un registro de tokens usados, o un `password_changed_at` que rechace tokens emitidos antes de ese momento. Codificar la expiración en el payload del JWT no basta.