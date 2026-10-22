# Qué debes hacer

## Vistas y navegación

- Crea una página de listado de candidaturas (`/`) que muestre todos los candidatos obtenidos desde `GET /records`.
- Crea una página de detalle de candidatura (`/candidates/[id]`) que obtenga y muestre los datos completos desde `GET /records/:id`.
- La navegación entre listado y detalle debe usar el sistema de rutas de Next.js, sin recargas completas de página.

---

## Listado de candidaturas

- Muestra el nombre completo, el puesto, el estado actual y la etapa actual de cada candidato.
- Implementa filtro por estado y filtro por etapa usando query parameters (`useSearchParams`).
- Implementa un campo de búsqueda que filtre por nombre o email sin recargar la página.
- Muestra un estado de carga mientras se obtienen los datos y un mensaje de error si la petición falla.

---

## Detalle de candidatura

- Muestra todos los campos disponibles: nombre, email, teléfono, puesto, LinkedIn, enlace al CV, años de experiencia, estado, etapa y fecha de aplicación.
- Incluye un control para actualizar el estado mediante `PATCH /records/:id`.
- Incluye un control para actualizar la etapa mediante `PATCH /records/:id`.
- Muestra el listado de notas obtenidas desde `GET /records/:id/notes`.
- Permite añadir una nueva nota mediante `POST /records/:id/notes`.
- Permite eliminar una nota mediante `DELETE /records/:id/notes/:note_id`.

---

## Gestión de candidaturas

- Incluye un formulario para registrar una nueva candidatura (`POST /records`).
- Incluye un formulario para editar los datos de una candidatura (`PUT /records/:id`).
- Ambos formularios deben validar los campos requeridos antes de enviarse.
- Muestra feedback de éxito o error tras cada envío.

---

## Estado y manejo asíncrono

- Todas las llamadas a la API deben gestionarse con `async/await`.
- Cada operación de obtención de datos debe tener al menos tres estados en la UI: cargando, éxito y error.
- Tras un `PATCH`, `PUT` o `POST`, actualiza la interfaz para reflejar el cambio sin requerir una recarga completa de página.

---

## Estructura del código

- Organiza el proyecto con una estructura de carpetas clara: `/components`, `/hooks` (si aplica), `/types`, `/lib` o `/services`.
- Define tipos TypeScript para todas las estructuras de datos recibidas de la API.

> ⚠️ IMPORTANTE: Los nombres de campos, etiquetas visibles, estados y valores específicos del dominio en tu implementación deben coincidir con lo especificado en tu hito3-context.md. la interfaz debe sentirse como una herramienta interna del equipo de People & Talent de Nexova, aunque los nombres de la API sigan siendo los definidos por el tracker backend. Una implementación genérica que ignore el contexto de empresa no será aceptada.

> ⚠️ IMPORTANTE: Usa únicamente Next.js (App Router), React y TypeScript. No uses librerías externas de gestión de estado (Redux, Zustand, Jotai, etc.). El estado a nivel de componente con hooks es suficiente para este hito.

---

# Qué vamos a evaluar

- La página de listado renderiza correctamente los datos obtenidos de la API.
- Los filtros por estado y etapa funcionan usando query parameters sin recargas de página.
- La búsqueda por nombre o email funciona sin recargar la página.
- La página de detalle carga y muestra todos los campos del candidato correcto por ID.
- El estado y la etapa se pueden actualizar desde el detalle usando `PATCH`.
- Las notas se pueden listar, añadir y eliminar desde el detalle.
- Las nuevas candidaturas se pueden registrar mediante un formulario usando `POST`.
- Los datos de una candidatura existente se pueden editar mediante un formulario usando `PUT`.
- Los estados de carga, éxito y error son visibles para el usuario en todas las operaciones asíncronas.
- Los tipos TypeScript están definidos y se usan para las estructuras de datos de la API.
- La estructura de carpetas separa componentes, tipos y lógica de acceso a datos.
- El App Router de Next.js se usa correctamente para navegación y rutas dinámicas.
- No hay prop drilling: el estado está correctamente acotado a nivel de componente.
- La implementación refleja el contexto de la empresa asignada (nombres de campo, etiquetas, valores del dominio).