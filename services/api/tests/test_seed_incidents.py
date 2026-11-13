import csv
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from scripts.seed_incidents import seed_incidents
from fastapi.testclient import TestClient
from services.api.app import create_app
from services.api.database import CompanyDatabase
from services.api.incident_store import IncidentStore


BASE_ROW = {
    "date": "2026-02-03",
    "client_company": "Fictional Corp",
    "category": "TECHNICAL",
    "description": "  Dashboard unavailable since morning.  ",
    "agent_id": "AGT-01",
    "status": "OPEN",
    "customer_email": "support@example.test",
}


def write_csv(path, fieldnames, rows):
    with path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def test_seed_fallback_is_idempotent_and_maps_incident(tmp_path):
    csv_path = tmp_path / "history.csv"
    db_path = tmp_path / "incidents.json"
    fieldnames = list(BASE_ROW)
    row = dict(BASE_ROW)
    write_csv(csv_path, fieldnames, [row])

    assert seed_incidents(csv_path, db_path) == (1, 1, [])
    assert seed_incidents(csv_path, db_path) == (0, 1, [])

    database = CompanyDatabase(db_path)
    try:
        incidents = IncidentStore(database).list()
    finally:
        database.close()

    assert len(incidents) == 1
    incident = incidents[0]
    assert incident.title == "Dashboard unavailable since morning."
    assert incident.description == row["description"]
    assert incident.category == "technical_failure"
    assert incident.status == "open"
    assert incident.origin == "customer"
    assert incident.branch == "central"
    assert incident.created_at == datetime(2026, 2, 3, tzinfo=timezone.utc)
    assert incident.updated_at.tzinfo == timezone.utc


def test_seed_rejects_duplicate_fallback_keys_in_same_csv(tmp_path):
    csv_path = tmp_path / "history.csv"
    db_path = tmp_path / "incidents.json"
    row = dict(BASE_ROW)
    write_csv(csv_path, list(BASE_ROW), [row, row])

    inserted, valid, invalid = seed_incidents(csv_path, db_path)

    assert (inserted, valid) == (1, 1)
    assert invalid == [(3, ["duplicate_title_created_at"])]


def test_seed_keeps_ticket_id_as_internal_idempotency_metadata(tmp_path):
    csv_path = tmp_path / "history.csv"
    db_path = tmp_path / "incidents.json"
    row = {"ticket_id": "NXV-000001", **BASE_ROW}
    write_csv(csv_path, list(row), [row])

    assert seed_incidents(csv_path, db_path) == (1, 1, [])
    assert seed_incidents(csv_path, db_path) == (0, 1, [])

    database = CompanyDatabase(db_path)
    try:
        incidents = IncidentStore(database).list()
        raw_records = database.table("incidents").all()
    finally:
        database.close()

    assert len(incidents) == 1
    assert "ticket_id" not in incidents[0].model_dump()
    assert raw_records[0]["source_id"] == "NXV-000001"


def test_seed_historical_csv_produces_expected_transformed_counts(tmp_path):
    csv_path = Path(__file__).resolve().parents[3] / "scripts" / "incidents-nexova.csv"
    db_path = tmp_path / "incidents.json"

    inserted, valid, invalid = seed_incidents(csv_path, db_path)

    assert (inserted, valid, len(invalid)) == (96, 96, 4)
    database = CompanyDatabase(db_path)
    try:
        incidents = IncidentStore(database).list()
    finally:
        database.close()

    assert Counter(incident.status for incident in incidents) == {
        "open": 27,
        "resolved": 56,
        "discarded": 13,
    }
    assert Counter(incident.category for incident in incidents) == {
        "technical_failure": 49,
        "process_error": 35,
        "client_complaint": 12,
    }


def test_api_startup_can_seed_historical_incidents(tmp_path):
    db_path = tmp_path / "incidents.json"
    app = create_app(db_path, seed_incidents_on_startup=True)

    with TestClient(app) as client:
        registration = client.post(
            "/users",
            json={"email": "seed-startup@example.com", "password": "test-password"},
        )
        assert registration.status_code == 201
        login = client.post(
            "/auth/login",
            data={"username": "seed-startup@example.com", "password": "test-password"},
        )
        assert login.status_code == 200
        summary = client.get(
            "/api/incidents/summary",
            headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        ).json()

    assert summary["total"] == 96
    assert summary["by_status"] == {
        "open": 27,
        "in_progress": 0,
        "resolved": 56,
        "discarded": 13,
    }
    assert summary["by_category"] == {
        "technical_failure": 49,
        "process_error": 35,
        "client_complaint": 12,
        "candidate_issue": 0,
        "staff_issue": 0,
        "sla_breach": 0,
        "data_quality": 0,
        "other": 0,
    }
