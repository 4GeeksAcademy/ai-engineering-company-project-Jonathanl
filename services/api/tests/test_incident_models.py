from datetime import timezone
from uuid import UUID

import pytest
from pydantic import ValidationError

from packages.shared.incident_csv import validate_incident_csv_row
from services.api.incident_models import Incident, IncidentCreate


def create_payload(**overrides):
    payload = {
        "title": "Service unavailable",
        "description": "The internal dashboard is not responding.",
        "category": "technical_failure",
        "status": "open",
        "origin": "branch",
        "branch": "valencia_operations",
    }
    payload.update(overrides)
    return payload


def test_incident_create_accepts_briefing_values_and_rejects_generated_fields():
    incident = IncidentCreate.model_validate(create_payload())

    assert incident.branch == "valencia_operations"
    with pytest.raises(ValidationError):
        IncidentCreate.model_validate(create_payload(id="00000000-0000-0000-0000-000000000000"))


@pytest.mark.parametrize(
    "field,value",
    [
        ("title", "  "),
        ("description", ""),
        ("category", "unknown"),
        ("status", "pending"),
        ("origin", "employee"),
        ("branch", "headquarters"),
    ],
)
def test_incident_create_rejects_empty_or_disallowed_values(field, value):
    with pytest.raises(ValidationError):
        IncidentCreate.model_validate(create_payload(**{field: value}))


@pytest.mark.parametrize("field", ["title", "description", "category", "status", "origin", "branch"])
def test_incident_create_requires_all_business_fields(field):
    payload = create_payload()
    del payload[field]

    with pytest.raises(ValidationError):
        IncidentCreate.model_validate(payload)


def test_incident_generates_unique_id_and_utc_timestamps():
    first = Incident.model_validate(create_payload())
    second = Incident.model_validate(create_payload())

    assert isinstance(first.id, UUID)
    assert first.id != second.id
    assert first.created_at.tzinfo == timezone.utc
    assert first.updated_at.tzinfo == timezone.utc


def test_shared_csv_validation_rejects_invalid_and_duplicate_rows():
    row = {
        "ticket_id": "NXV-000001",
        "date": "2026-01-02",
        "client_company": "Example Corp",
        "category": "TECHNICAL",
        "description": "Example incident description",
        "agent_id": "AGT-01",
        "status": "OPEN",
        "customer_email": "fictional@example.com",
    }

    assert validate_incident_csv_row(row, set()) == []
    assert validate_incident_csv_row(row, {"NXV-000001"}) == ["ticket_id_duplicate"]
    assert "category_invalid" in validate_incident_csv_row({**row, "category": "UNKNOWN"}, set())
    without_ticket_id = {key: value for key, value in row.items() if key != "ticket_id"}
    assert "ticket_id_missing" in validate_incident_csv_row(without_ticket_id, set())
    assert validate_incident_csv_row(without_ticket_id, set(), allow_missing_ticket_id=True) == []
