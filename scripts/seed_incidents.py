"""Load validated historical analyzer tickets into the Nexova incident store."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from datetime import date, datetime, time, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.shared.incident_csv import (  # noqa: E402
    CSV_CATEGORIES,
    CSV_REQUIRED_COLUMNS,
    CSV_STATUSES,
    validate_incident_csv_row,
)
from services.api.database import CompanyDatabase  # noqa: E402
from services.api.incident_models import IncidentCreate  # noqa: E402
from services.api.incident_store import IncidentStore  # noqa: E402

DEFAULT_CSV = ROOT / "scripts" / "incidents-nexova.csv"
DEFAULT_DB = ROOT / "data" / "runtime" / "suppliers.json"


class CsvInputError(Exception):
    """Raised when the source CSV cannot be read or parsed."""


class DatabaseSeedError(Exception):
    """Raised when the local database cannot be updated."""

STATUS_MAP = {"OPEN": "open", "CLOSED": "resolved", "DISCARDED": "discarded"}
CATEGORY_MAP = {
    "TECHNICAL": "technical_failure",
    "BILLING": "process_error",
    "ACCESS": "technical_failure",
    "HR_QUERY": "process_error",
    "COMPLAINT": "client_complaint",
}


def _read_rows(csv_path: Path) -> tuple[list[dict[str, str | list[str] | None]], set[str]]:
    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file, strict=True)
            if reader.fieldnames is None:
                raise ValueError("El CSV esta vacio o no tiene cabecera.")
            if len(set(reader.fieldnames)) != len(reader.fieldnames):
                raise ValueError("La cabecera contiene columnas duplicadas.")
            # ticket_id is optional for the seed: rows without it use title+created_at.
            missing = [
                column
                for column in CSV_REQUIRED_COLUMNS
                if column != "ticket_id" and column not in reader.fieldnames
            ]
            if missing:
                raise ValueError("Faltan columnas requeridas: " + ", ".join(missing))
            rows = list(reader)
    except (OSError, UnicodeError, csv.Error) as error:
        raise CsvInputError("No se pudo leer o parsear el archivo CSV.") from error

    if not rows:
        raise ValueError("El CSV no contiene registros.")

    id_counts = Counter(
        row.get("ticket_id", "").strip()
        for row in rows
        if isinstance(row.get("ticket_id"), str) and row.get("ticket_id", "").strip()
    )
    duplicate_ids = {ticket_id for ticket_id, count in id_counts.items() if count > 1}
    return rows, duplicate_ids


def transform_row(row: dict[str, str | list[str] | None]) -> tuple[str, IncidentCreate, datetime]:
    """Validate and translate one analyzer CSV row to the incidents domain model."""
    ticket_id = row.get("ticket_id")
    description = row.get("description")
    raw_date = row.get("date")
    raw_status = row.get("status")
    raw_category = row.get("category")
    if not all(isinstance(value, str) for value in (description, raw_date, raw_status, raw_category)):
        raise ValueError("Faltan datos requeridos para transformar la fila.")

    title = description[:120].strip()
    if not title:
        raise ValueError("description no genera un titulo valido.")

    created_at = datetime.combine(date.fromisoformat(raw_date.strip()), time.min, tzinfo=timezone.utc)
    try:
        status = STATUS_MAP[raw_status.strip()]
        category = CATEGORY_MAP[raw_category.strip()]
    except KeyError:
        raise ValueError("No hay un mapeo válido para el estado o la categoría.") from None

    incident = IncidentCreate(
        title=title,
        description=description,
        category=category,
        status=status,
        origin="customer",
        branch="central",
    )
    normalized_ticket_id = ticket_id.strip() if isinstance(ticket_id, str) else ""
    source_id = (
        normalized_ticket_id
        if normalized_ticket_id
        else "fallback:" + json.dumps([title, created_at.isoformat()], ensure_ascii=False)
    )
    return source_id, incident, created_at


def seed_incidents(csv_path: Path = DEFAULT_CSV, db_path: Path = DEFAULT_DB) -> tuple[int, int, list[tuple[int, list[str]]]]:
    """Seed valid rows idempotently; return inserted/valid counts and invalid reasons."""
    rows, duplicate_ids = _read_rows(Path(csv_path))
    invalid: list[tuple[int, list[str]]] = []
    to_insert: list[tuple[str, IncidentCreate, datetime]] = []
    fallback_ids: set[str] = set()

    for row_number, row in enumerate(rows, start=2):
        issues = validate_incident_csv_row(row, duplicate_ids, allow_missing_ticket_id=True)
        if issues:
            invalid.append((row_number, issues))
            continue
        try:
            transformed = transform_row(row)
            source_id = transformed[0]
            if source_id.startswith("fallback:"):
                if source_id in fallback_ids:
                    invalid.append((row_number, ["duplicate_title_created_at"]))
                    continue
                fallback_ids.add(source_id)
            to_insert.append(transformed)
        except (ValueError, TypeError):
            invalid.append((row_number, ["Datos de fila no válidos."]))

    database: CompanyDatabase | None = None
    try:
        database = CompanyDatabase(Path(db_path))
        store = IncidentStore(database)
        inserted = 0
        for source_id, incident, created_at in to_insert:
            if store.exists_source_id(source_id):
                continue
            store.create(incident, source_id=source_id, created_at=created_at)
            inserted += 1
    except Exception as error:
        raise DatabaseSeedError("No se pudo actualizar la base local.") from error
    finally:
        if database is not None:
            try:
                database.close()
            except Exception:
                raise DatabaseSeedError("No se pudo cerrar la base local.") from error

    return inserted, len(to_insert), invalid


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Carga incidencias históricas válidas desde el CSV del analizador.")
    parser.add_argument("csv_file", nargs="?", type=Path, default=DEFAULT_CSV, help="Ruta al CSV histórico")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="Ruta de la base TinyDB (por defecto, base local de API)")
    args = parser.parse_args(argv)

    try:
        inserted, valid, invalid = seed_incidents(args.csv_file, args.db)
    except (CsvInputError, ValueError, DatabaseSeedError):
        print("Error al cargar incidencias: revisa el CSV y vuelve a intentarlo.", file=sys.stderr)
        return 1

    print(f"Incidencias válidas: {valid}; insertadas en esta ejecución: {inserted}.")
    print(f"Filas inválidas descartadas: {len(invalid)}.")
    for row_number, reasons in invalid:
        print(f"  Fila {row_number}: {', '.join(reasons)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
