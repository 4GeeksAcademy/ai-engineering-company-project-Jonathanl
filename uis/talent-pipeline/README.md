# Nexova · Pipeline de candidaturas

Frontend interno para que People & Talent gestione el pipeline de selección de Nexova.

## Stack

- Next.js App Router
- React
- TypeScript
- API: `https://playground.4geeks.com/tracker/api/v1`

## Estructura

```text
src/
├── app/                         # Rutas y pantallas del App Router
│   ├── candidates/
│   │   ├── [id]/                # Detalle y edición de candidaturas
│   │   └── new/                 # Alta de candidaturas
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Pipeline/listado
├── components/                 # Componentes de interfaz reutilizables
├── lib/                         # Acceso a API y lógica compartida del dominio
│   ├── api.ts
│   └── domain.ts
└── types/                       # Contratos TypeScript de API/dominio
	└── candidate.ts
```

Las páginas contienen el estado de interfaz de cada flujo; `lib/api.ts` concentra las llamadas HTTP y `types/candidate.ts` define los datos de entrada y salida. Los catálogos de estado/etapa y utilidades de presentación compartidas están en `lib/domain.ts`. No se usa una librería externa de gestión de estado.

Configura `NEXT_PUBLIC_API_URL` en `.env.local` para apuntar a la API de Tracker antes de iniciar la aplicación.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre la URL que indique Next.js en la terminal (normalmente `http://localhost:3000`). Para validar tipos y generar el build de producción:

```bash
npm run typecheck
npm run build
```
