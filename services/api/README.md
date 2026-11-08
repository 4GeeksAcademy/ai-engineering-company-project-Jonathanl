# API de incidencias Nexova

## Inicio local

Desde la raiz del repositorio:

```bash
uv sync --extra dev
uv run seed
uv run uvicorn services.api.app:app --host 0.0.0.0 --port 5050
```

La API requiere `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES` en el entorno o en
`.env`. Copia `.env.example` a `.env`, genera una clave aleatoria (por ejemplo,
con `openssl rand -hex 32`) y configura ambas variables. No compartas la clave
ni la guardes en Git. `SECRET_KEY` no tiene valor por defecto y la API no inicia
si falta alguna de estas variables.

`uv run seed` carga los 15 proveedores del contexto solo si la tabla esta vacia e
informa cuantas filas inserto. Repetir el comando no duplica ni sobrescribe
proveedores. Uvicorn tambien inicializa la base automaticamente si aun esta
vacia.

Backoffice: http://localhost:5050/uis/backoffice/
Directorio de proveedores: http://localhost:5050/uis/backoffice/suppliers.html
Aplicacion existente: http://localhost:5050/uis/index.html

La API sirve ambas interfaces en el mismo origen. No abras el backoffice con
`file://` ni con un servidor estatico independiente.

## Endpoints

`POST /api/incidents/analyze`: multipart/form-data, campo `file`, extension `.csv`,
UTF-8, cabecera, separador coma, limite de solicitud 5 MB.

Ambas rutas requieren `Authorization: Bearer <token>`. Obtén un token con
`POST /auth/login` y úsalo en las solicitudes:

```bash
curl -H "Authorization: Bearer $TOKEN" -F file=@scripts/incidents-nexova.csv http://localhost:5050/api/incidents/analyze
curl -H "Authorization: Bearer $TOKEN" -o results.csv http://localhost:5050/api/incidents/results/export
```

El JSON contiene `total`, `valid`, `invalid`, `invalid_reasons`, `categories`,
`statuses` y `satisfaction` (`closed`, `scored`, `average`, `distribution`).
Categorias: TECHNICAL, BILLING, ACCESS, HR_QUERY, COMPLAINT.
Estados: OPEN, CLOSED, DISCARDED. Puntuaciones: enteros de 1 a 5.
La media es `null` si no hay tickets cerrados validos puntuados.

`GET /api/incidents/results/export`: descarga `results.csv` con columnas
`metric,value`, una fila por metrica, usando el mismo exportador que la CLI.

Errores JSON con campo `error`:

| HTTP | Situacion |
| --- | --- |
| 400 | Archivo ausente, vacio o multipart incorrecto |
| 404 | No existe un ultimo analisis para exportar |
| 413 | Solicitud mayor de 5 MB |
| 415 | Tipo de solicitud o extension no admitidos |
| 422 | UTF-8 incorrecto, cabecera invalida, CSV mal formado o sin registros |

Los registros invalidos no son un error HTTP: devuelven 200 con los conteos de
cada motivo. Una fila cuenta una vez en `invalid`, pero puede activar varios
motivos. Los porcentajes usan como denominador los registros validos.

## Logica y privacidad

`services/api/incidents.py` concentra validacion, analisis y generacion CSV.
`scripts/analyze.py` conserva la interfaz de consola y usa ese mismo modulo.
Se validan los campos del CONTEXT, incluyendo identificadores unicos, fechas,
estados, categorias y puntuaciones; la regla de email comprueba que contiene `@`.
Todos los registros con un ticket_id repetido se excluyen como duplicados.
No se devuelven filas, emails ni descripciones. El archivo se procesa en memoria
y no se guarda en disco; tampoco se registra su contenido.

Este servicio es una integracion local de un solo usuario, no un despliegue de
produccion. Solo conserva el ultimo CSV agregado en memoria de la instancia;
es compartido entre clientes y desaparece al reiniciar. Una carga fallida no lo
sustituye. No iniciar multiples workers para este modelo de almacenamiento.
Antes de uso multiusuario se necesitan autenticacion, aislamiento de resultados
y almacenamiento adecuado. Uvicorn se usa aqui como servidor local de desarrollo.

## Verificacion del fixture dummy

`scripts/incidents-nexova.csv`: 100 filas, 96 validas y 4 invalidas.
Categorias: 28 / 18 / 21 / 17 / 12.
Estados: 27 / 56 / 13. Satisfaccion media: 3.84.
Distribucion de puntuaciones 1 a 5: 2 / 5 / 10 / 22 / 17.

La CLI se ejecuta desde la raiz con:

```bash
python scripts/analyze.py scripts/incidents-nexova.csv
```

O desde `scripts/`, con `python analyze.py incidents-nexova.csv`.

## Directorio de proveedores

El directorio se sirve en la misma API FastAPI. Al iniciar, TinyDB crea
`data/runtime/suppliers.json` y carga los 15 proveedores del contexto solo si la
tabla esta vacia. El archivo es estado local mutable y no se versiona. Un
reinicio conserva altas y cambios existentes.

| Metodo | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/suppliers` | Lista proveedores; admite `country` y `category` combinables |
| `POST` | `/api/suppliers` | Crea proveedor validado |
| `GET` | `/api/suppliers/{id}` | Consulta por UUID |
| `PATCH` | `/api/suppliers/{id}` | Cambia `monthly_rate` o `status` |

Los paises admitidos son `Spain` y `USA`, con moneda `EUR` y `USD`
respectivamente. Categorias y estados deben coincidir con
`CONTEXT-nexova.es.md`; la tarifa debe ser mayor que cero. La API genera
`updated_at` al crear un proveedor y al actualizar su tarifa. Cambiar estado no
modifica ese timestamp. Las entradas invalidas reciben `422`; los proveedores
suspendidos se conservan y no existe endpoint de borrado.

Para validar el backend:

```bash
uv run pytest services/api/tests
```

## Autenticacion y usuarios

La API usa JWT Bearer stateless. El registro y el login son publicos; las rutas
de proveedores e incidencias requieren un token. `/docs` y los archivos
estaticos siguen siendo publicos. Las contrasenas se guardan como hash bcrypt;
las respuestas de usuario nunca incluyen el hash.

| Metodo | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| `POST` | `/users` | Publico | Registra usuario y perfil; role siempre `user` |
| `POST` | `/auth/login` | Publico | Formulario OAuth2; `username` es el email |
| `GET` | `/auth/me` | Autenticado | Usuario actual y perfil |
| `GET` | `/users` | Admin | Lista usuarios |
| `GET` | `/users/{id}` | Propio o admin | Consulta usuario |
| `PUT` | `/users/{id}` | Propio o admin | El usuario cambia email; role solo admin |
| `DELETE` | `/users/{id}` | Admin | Elimina usuario y perfil; no permite borrar el ultimo admin activo |
| `GET` | `/profiles/me` | Autenticado | Consulta perfil propio |
| `PUT` | `/profiles/me` | Autenticado | Actualiza `name`, `phone` o `address` propios |

En Swagger, registra una cuenta con `POST /users`, pulsa **Authorize** e inicia
sesion con el email como `username` y su contrasena. Tambien puedes ejecutar
`POST /auth/login` directamente; la respuesta contiene `access_token` y
`token_type`.

### Crear el primer administrador

El registro publico no acepta roles privilegiados. Para crear el primer admin,
añade estas variables a `.env` (no al repositorio) y ejecuta el comando de
bootstrap de forma explicita:

```dotenv
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=un-secreto-largo-y-unico
```

```bash
uv run seed-admin
```

El comando crea el usuario admin y su perfil, guarda un hash bcrypt y no muestra
la contrasena. Puede repetirse con las mismas credenciales sin modificar la
cuenta existente. No promueve usuarios ya registrados y no se ejecuta al
arrancar Uvicorn. Borra las variables de bootstrap de `.env` cuando ya no sean
necesarias.

Para un flujo local completo, crea primero el admin, inicia Uvicorn, abre
`http://localhost:5050/docs`, autoriza con **Authorize** y prueba `/auth/me` o
una ruta protegida de proveedores. Las rutas privadas devuelven `401` sin un
token valido; un usuario autenticado sin permisos recibe `403`.