"""Shared validation primitives for the historical incidents CSV."""

from __future__ import annotations

import re
from datetime import date

CSV_CATEGORIES = ("TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT")
CSV_STATUSES = ("OPEN", "CLOSED", "DISCARDED")
CSV_REQUIRED_COLUMNS = (
    "ticket_id",
    "date",
    "client_company",
    "category",
    "description",
    "agent_id",
    "status",
    "customer_email",
)

CSV_REASON_LABELS = {
    "malformed_row": "Malformed CSV row",
    "ticket_id_missing": "Missing ticket_id",
    "ticket_id_invalid": "Invalid ticket_id",
    "ticket_id_duplicate": "Duplicate ticket_id",
    "date_missing": "Missing date",
    "date_invalid": "Invalid date",
    "client_company_missing": "Missing client_company",
    "category_invalid": "Invalid or missing category",
    "description_invalid": "Empty or too-short description",
    "agent_id_invalid": "Invalid or missing agent_id",
    "status_invalid": "Invalid or missing status",
    "email_invalid": "Invalid or missing email",
    "closed_score_missing": "Closed ticket, no score",
    "score_invalid": "Invalid satisfaction score",
}

TICKET_ID_PATTERN = re.compile(r"^NXV-\d{6}$")
AGENT_ID_PATTERN = re.compile(r"^AGT-\d{2}$")


def validate_incident_csv_row(row: dict[str, str | list[str] | None], duplicate_ids: set[str]) -> list[str]:
    """Return all analyzer validation issue codes found on one CSV row."""
    issues: list[str] = []
    if None in row:
        issues.append("malformed_row")

    def value(field: str) -> str:
        raw_value = row.get(field)
        return raw_value.strip() if isinstance(raw_value, str) else ""

    ticket_id = value("ticket_id")
    if not ticket_id:
        issues.append("ticket_id_missing")
    elif not TICKET_ID_PATTERN.fullmatch(ticket_id):
        issues.append("ticket_id_invalid")
    elif ticket_id in duplicate_ids:
        issues.append("ticket_id_duplicate")

    date_value = value("date")
    if not date_value:
        issues.append("date_missing")
    else:
        try:
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_value):
                raise ValueError
            date.fromisoformat(date_value)
        except ValueError:
            issues.append("date_invalid")

    if not value("client_company"):
        issues.append("client_company_missing")

    if value("category") not in CSV_CATEGORIES:
        issues.append("category_invalid")

    if len(value("description")) < 5:
        issues.append("description_invalid")

    if not AGENT_ID_PATTERN.fullmatch(value("agent_id")):
        issues.append("agent_id_invalid")

    status = value("status")
    if status not in CSV_STATUSES:
        issues.append("status_invalid")

    if "@" not in value("customer_email"):
        issues.append("email_invalid")

    score_value = value("satisfaction_score")
    if status == "CLOSED" and not score_value:
        issues.append("closed_score_missing")
    elif score_value:
        try:
            score = int(score_value)
            if not 1 <= score <= 5:
                raise ValueError
        except ValueError:
            issues.append("score_invalid")

    return issues
