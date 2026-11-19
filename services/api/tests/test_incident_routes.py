from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from services.api.app import create_app


@pytest.fixture
def api_client(tmp_path):
    app = create_app(tmp_path / "runtime" / "incidents.json")
    with TestClient(app) as client:
        registration = client.post(
            "/users",
            json={"email": "incident-test@example.com", "password": "test-password"},
        )
        assert registration.status_code in (201, 409)
        login = client.post(
            "/auth/login",
            data={"username": "incident-test@example.com", "password": "test-password"},
        )
        assert login.status_code == 200
        client.headers["Authorization"] = f"Bearer {login.json()['access_token']}"
        yield client


def payload(**overrides):
    incident = {
        "title": "No se puede acceder al ATS",
        "description": "El equipo de operaciones no puede iniciar sesión en el ATS.",
        "category": "technical_failure",
        "status": "open",
        "origin": "branch",
        "branch": "valencia_operations",
    }
    incident.update(overrides)
    return incident


def test_incident_crud_and_status_lifecycle(api_client):
    created_response = api_client.post("/api/incidents", json=payload())
    assert created_response.status_code == 201
    created = created_response.json()
    assert created["id"]
    assert created["created_at"] == created["updated_at"]

    assert api_client.get("/api/incidents").json() == [created]
    assert api_client.get("/api/incidents", params={"origin": "branch", "branch": "valencia_operations"}).json() == [created]
    assert api_client.get("/api/incidents", params={"category": "sla_breach"}).json() == []
    assert api_client.get(f"/api/incidents/{created['id']}").json() == created

    in_progress_response = api_client.patch(
        f"/api/incidents/{created['id']}/status",
        json={"status": "in_progress"},
    )
    assert in_progress_response.status_code == 200
    in_progress = in_progress_response.json()
    assert in_progress["status"] == "in_progress"
    assert datetime.fromisoformat(in_progress["updated_at"]) >= datetime.fromisoformat(created["updated_at"])

    resolved = api_client.patch(
        f"/api/incidents/{created['id']}/status",
        json={"status": "resolved"},
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"

    final_state_attempt = api_client.patch(
        f"/api/incidents/{created['id']}/status",
        json={"status": "open"},
    )
    assert final_state_attempt.status_code == 400
    assert final_state_attempt.json()["error"]["field"] == "status"
    assert api_client.get(f"/api/incidents/{created['id']}").json()["status"] == "resolved"


def test_create_validation_returns_field_specific_400(api_client):
    missing = payload()
    del missing["branch"]
    response = api_client.post("/api/incidents", json=missing)
    assert response.status_code == 400
    assert response.json()["error"]["field"] == "branch"

    invalid = api_client.post("/api/incidents", json=payload(category="unknown"))
    assert invalid.status_code == 400
    assert invalid.json()["error"]["field"] == "category"
    assert "message" in invalid.json()["error"]

    empty_title = api_client.post("/api/incidents", json=payload(title="   "))
    assert empty_title.status_code == 400
    assert empty_title.json()["error"]["field"] == "title"

    malformed_json = api_client.post(
        "/api/incidents",
        content="{not json",
        headers={"content-type": "application/json"},
    )
    assert malformed_json.status_code == 400
    assert malformed_json.json()["error"]["field"] == "request"


def test_invalid_filters_and_status_payload_are_field_specific(api_client):
    filtered = api_client.get("/api/incidents", params={"status": "pending"})
    assert filtered.status_code == 400
    assert filtered.json()["error"]["field"] == "status"

    malformed_status = api_client.patch(
        "/api/incidents/00000000-0000-0000-0000-000000000000/status",
        json={"status": "pending"},
    )
    assert malformed_status.status_code == 400
    assert malformed_status.json()["error"]["field"] == "status"


def test_not_found_ids_and_invalid_uuid(api_client):
    not_found = api_client.get("/api/incidents/00000000-0000-0000-0000-000000000000")
    assert not_found.status_code == 404
    assert not_found.json()["error"] == "Incidencia no encontrada."

    invalid_id = api_client.get("/api/incidents/not-a-uuid")
    assert invalid_id.status_code == 400
    assert invalid_id.json()["error"]["field"] == "id"

    missing_update = api_client.patch(
        "/api/incidents/00000000-0000-0000-0000-000000000000/status",
        json={"status": "in_progress"},
    )
    assert missing_update.status_code == 404


def test_empty_summary_has_zero_counts_for_every_dimension(api_client):
    response = api_client.get("/api/incidents/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total"] == 0
    assert all(count == 0 for dimension in summary.values() if isinstance(dimension, dict) for count in dimension.values())


def test_summary_counts_all_dimensions(api_client):
    api_client.post("/api/incidents", json=payload())
    api_client.post(
        "/api/incidents",
        json=payload(
            title="Demora en respuesta",
            category="sla_breach",
            status="in_progress",
            origin="customer",
            branch="central",
        ),
    )

    summary = api_client.get("/api/incidents/summary").json()
    assert summary["total"] == 2
    assert summary["by_status"]["open"] == 1
    assert summary["by_status"]["in_progress"] == 1
    assert summary["by_category"]["technical_failure"] == 1
    assert summary["by_category"]["sla_breach"] == 1
    assert summary["by_origin"]["branch"] == 1
    assert summary["by_origin"]["customer"] == 1
    assert summary["by_branch"]["valencia_operations"] == 1
    assert summary["by_branch"]["central"] == 1
