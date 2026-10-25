# Hito 2 — Utilidades de selección Nexova

La lógica de Hito 2 está organizada por responsabilidad:

- `types/models.ts`: entidades y tipos de dominio (`Candidate`, `Vacancy`, `SelectionProcess`).
- `utils/collections.ts`: filtros y ordenamientos de candidatos.
- `utils/search.ts`: búsquedas lineales por ID/email y búsqueda binaria por salario esperado.
- `utils/transformations.ts`: scoring, ranking, agrupaciones y reportes.
- `utils/validations.ts`: validación de candidatos, vacantes y email.

## Comandos

Desde la raíz del repositorio:

```bash
npm install
npm run typecheck
```

Para compilar las utilidades como módulos ES y servir la interfaz de prueba del navegador en `http://localhost:3000`:

```bash
npm run serve:hito2-demo
```

La demo está en `uis/backoffice/hito2/` y usa los datos de ejemplo especificados en `nexova-BRIEFING.es.md`.
