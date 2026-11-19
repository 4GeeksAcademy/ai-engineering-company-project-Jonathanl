# `packages` folder

## Shared Python CSV validation

`shared/incident_csv.py` contains the historical incidents CSV field
validation and source enums used by both `services/api/incidents.py` (the
existing analyzer) and `scripts/seed_incidents.py`. Keeping these rules here
prevents the analyzer and the seed from accepting different source records.

This folder contains **shared packages** for the monorepo: internal libraries, utilities, types, shared components, SDKs, clients, and any code reused by multiple applications, agents, or pipelines.

Each subfolder under `packages/` should represent **one versionable package** (for example `shared-types`, `ui`, `analytics-sdk`) with its own README.

- **Main purpose**: encourage reuse and consistency across all company deliverables.
- **Recommendation**: document packages as you add them—their public API and how they are consumed from `apps/`, `agents/`, and `workflows/`.

> _Spanish version: [README.es.md](./README.es.md)._
