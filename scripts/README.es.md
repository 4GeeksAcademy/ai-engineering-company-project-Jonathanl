# Carpeta `scripts`

Esta carpeta contiene **scripts auxiliares** del monorepo: automatizaciones de desarrollo, utilidades de mantenimiento, tareas repetitivas (setup, lint, migraciones, generación de datos, etc.) y tooling interno.

- **Propósito principal**: agrupar herramientas de soporte que no pertenecen a una app/agente/pipeline específico, pero facilitan el trabajo del equipo.
- **Recomendación**: documenta cada script (qué hace, parámetros, requisitos, ejemplos de uso) y procura que sean reproducibles (y seguros) en distintos entornos.

## Seed del histórico de incidencias

`seed_incidents.py` valida el CSV histórico con las reglas compartidas desde
`packages/shared/incident_csv.py`, transforma estados, categorías, título y
fecha al modelo de incidencias y asigna `origin=customer` y `branch=central`.
Los `ticket_id` duplicados se descartan como inválidos; ejecuciones sucesivas
no duplican registros ya insertados. Las filas inválidas se resumen al final
sin imprimir emails ni otros datos de cada ticket.

Desde la raíz del repositorio:

```bash
python scripts/seed_incidents.py
python scripts/seed_incidents.py ruta/al/historico.csv --db /tmp/incidents-test.json
```

La base por defecto es `data/runtime/suppliers.json`, compartida con la API
local; `--db` permite elegir otra ruta, por ejemplo para pruebas aisladas.
