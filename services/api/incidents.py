"""Shared Nexova validation, analysis and aggregate CSV export."""

from __future__ import annotations

import csv
import io
from collections import Counter
from pathlib import Path

from packages.shared.incident_csv import (
    CSV_CATEGORIES,
    CSV_REASON_LABELS,
    CSV_REQUIRED_COLUMNS,
    CSV_STATUSES,
    validate_incident_csv_row,
)


CATEGORIES = CSV_CATEGORIES

STATUSES = CSV_STATUSES

REQUIRED_COLUMNS = CSV_REQUIRED_COLUMNS
REASON_LABELS = CSV_REASON_LABELS

def analyze_csv(file_path: Path) -> dict[str, object]:
    with file_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        return analyze_stream(csv_file)

def analyze_stream(csv_file) -> dict[str, object]:
    reader = csv.DictReader(csv_file, strict=True)
    if reader.fieldnames is None:
        raise ValueError("El CSV esta vacio o no tiene cabecera.")
    if len(set(reader.fieldnames)) != len(reader.fieldnames):
        raise ValueError("La cabecera del CSV contiene columnas duplicadas.")
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in reader.fieldnames]
    if missing_columns:
        raise ValueError("Faltan columnas requeridas: " + ", ".join(missing_columns))
    rows = list(reader)
    if not rows:
        raise ValueError("El CSV no contiene registros.")

    id_counts = Counter(
        row.get("ticket_id", "").strip()
        for row in rows
        if isinstance(row.get("ticket_id"), str) and row.get("ticket_id", "").strip()
    )
    duplicate_ids = {ticket_id for ticket_id, count in id_counts.items() if count > 1}

    invalid_count = 0
    invalid_reasons: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    status_counts: Counter[str] = Counter()
    score_counts: Counter[int] = Counter()
    closed_count = 0
    scores: list[int] = []

    for row in rows:
        issues = validate_incident_csv_row(row, duplicate_ids)
        if issues:
            invalid_count += 1
            invalid_reasons.update(issues)
            continue

        category_counts[row["category"].strip()] += 1
        status = row["status"].strip()
        status_counts[status] += 1
        if status == "CLOSED":
            closed_count += 1
            score = int(row["satisfaction_score"])
            scores.append(score)
            score_counts[score] += 1

    return {
        "total": len(rows),
        "valid": len(rows) - invalid_count,
        "invalid": invalid_count,
        "invalid_reasons": invalid_reasons,
        "categories": category_counts,
        "statuses": status_counts,
        "closed": closed_count,
        "scores": scores,
        "score_counts": score_counts,
    }

def _percentage(count: int, total: int) -> str:
    return f"{count / total * 100:.1f}%" if total else "0.0%"

def render_csv(results: dict[str, object]) -> str:
    metrics: list[tuple[str, object]] = [
        ("total_records", results["total"]),
        ("valid_records", results["valid"]),
        ("invalid_records", results["invalid"]),
    ]
    invalid_reasons = results["invalid_reasons"]
    for reason in REASON_LABELS:
        metrics.append((f"invalid_{reason}", invalid_reasons[reason]))

    categories = results["categories"]
    statuses = results["statuses"]
    valid = int(results["valid"])
    for category in CATEGORIES:
        metrics.append((f"category_{category.lower()}_count", categories[category]))
        metrics.append((f"category_{category.lower()}_percent", _percentage(categories[category], valid)))
    for status in STATUSES:
        metrics.append((f"status_{status.lower()}_count", statuses[status]))
        metrics.append((f"status_{status.lower()}_percent", _percentage(statuses[status], valid)))

    scores = results["scores"]
    average = sum(scores) / len(scores) if scores else ""
    metrics.extend(
        [
            ("closed_tickets", results["closed"]),
            ("scored_closed_tickets", len(scores)),
            ("average_satisfaction", f"{average:.2f}" if average != "" else "N/A"),
        ]
    )
    score_counts = results["score_counts"]
    for score in range(1, 6):
        metrics.append((f"satisfaction_score_{score}_count", score_counts[score]))

    csv_file = io.StringIO(newline="")
    writer = csv.writer(csv_file)
    writer.writerow(("metric", "value"))
    writer.writerows(metrics)
    return csv_file.getvalue()
