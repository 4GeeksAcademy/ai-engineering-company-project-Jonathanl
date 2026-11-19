"""CRUD and summary endpoints for Nexova incidents."""

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from services.api.incident_models import (
    Incident,
    IncidentBranch,
    IncidentCategory,
    IncidentCreate,
    IncidentOrigin,
    IncidentStatus,
)
from services.api.incident_store import IncidentStore
from services.api.security import get_current_user


router = APIRouter(
    prefix="/api/incidents",
    tags=["incidents"],
    dependencies=[Depends(get_current_user)],
)

STATUS_TRANSITIONS: dict[str, set[str]] = {
    "open": {"in_progress", "discarded"},
    "in_progress": {"resolved", "discarded"},
    "resolved": set(),
    "discarded": set(),
}
ALL_STATUSES: tuple[IncidentStatus, ...] = ("open", "in_progress", "resolved", "discarded")
ALL_CATEGORIES: tuple[IncidentCategory, ...] = (
    "technical_failure",
    "process_error",
    "client_complaint",
    "candidate_issue",
    "staff_issue",
    "sla_breach",
    "data_quality",
    "other",
)
ALL_ORIGINS: tuple[IncidentOrigin, ...] = ("customer", "branch", "internal")
ALL_BRANCHES: tuple[IncidentBranch, ...] = (
    "central",
    "valencia_operations",
    "miami_office",
    "remote",
)


class IncidentStatusPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: IncidentStatus = Field(...)


def get_incident_store(request: Request) -> IncidentStore:
    return request.app.state.incident_store


def _validation_error(error: ValidationError) -> JSONResponse:
    issue = error.errors(include_url=False)[0]
    field = str(issue["loc"][-1]) if issue.get("loc") else "request"
    messages = {
        "missing": "Este campo es obligatorio.",
        "string_too_short": "Este campo no puede estar vacío.",
        "literal_error": "El valor no está permitido.",
        "extra_forbidden": "Este campo no está permitido.",
        "string_type": "Debe ser un texto válido.",
    }
    message = messages.get(issue["type"], "El valor no es válido.")
    return JSONResponse(
        {"error": {"field": field, "message": message}},
        status_code=400,
    )


async def _read_json(request: Request) -> dict | JSONResponse:
    try:
        payload = await request.json()
    except (ValueError, UnicodeDecodeError):
        return JSONResponse(
            {"error": {"field": "request", "message": "El cuerpo debe ser un JSON válido."}},
            status_code=400,
        )
    if not isinstance(payload, dict):
        return JSONResponse(
            {"error": {"field": "request", "message": "El cuerpo debe ser un objeto JSON."}},
            status_code=400,
        )
    return payload


@router.post("", response_model=Incident, status_code=201)
async def create_incident(request: Request, store: IncidentStore = Depends(get_incident_store)):
    payload = await _read_json(request)
    if isinstance(payload, JSONResponse):
        return payload
    try:
        incident_data = IncidentCreate.model_validate(payload)
    except ValidationError as error:
        return _validation_error(error)
    return store.create(incident_data)


@router.get("", response_model=list[Incident])
def list_incidents(
    status: str | None = None,
    origin: str | None = None,
    branch: str | None = None,
    category: str | None = None,
    store: IncidentStore = Depends(get_incident_store),
):
    filters = (
        ("status", status, ALL_STATUSES),
        ("origin", origin, ALL_ORIGINS),
        ("branch", branch, ALL_BRANCHES),
        ("category", category, ALL_CATEGORIES),
    )
    for field, value, allowed in filters:
        if value is not None and value not in allowed:
            return JSONResponse(
                {"error": {"field": field, "message": "El valor del filtro no está permitido."}},
                status_code=400,
            )

    incidents = store.list()
    for field, value, _ in filters:
        if value is not None:
            incidents = [incident for incident in incidents if getattr(incident, field) == value]
    return incidents


@router.get("/summary")
def incident_summary(store: IncidentStore = Depends(get_incident_store)):
    incidents = store.list()
    return {
        "total": len(incidents),
        "by_status": {value: sum(item.status == value for item in incidents) for value in ALL_STATUSES},
        "by_category": {value: sum(item.category == value for item in incidents) for value in ALL_CATEGORIES},
        "by_origin": {value: sum(item.origin == value for item in incidents) for value in ALL_ORIGINS},
        "by_branch": {value: sum(item.branch == value for item in incidents) for value in ALL_BRANCHES},
    }


@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str, store: IncidentStore = Depends(get_incident_store)):
    try:
        parsed_id = UUID(incident_id)
    except ValueError:
        return JSONResponse(
            {"error": {"field": "id", "message": "El identificador de incidencia no es válido."}},
            status_code=400,
        )
    incident = store.get(parsed_id)
    if incident is None:
        return JSONResponse(
            {"error": {"field": "id", "message": "Incidencia no encontrada."}},
            status_code=404,
        )
    return incident


@router.patch("/{incident_id}/status", response_model=Incident)
async def update_incident_status(
    incident_id: str,
    request: Request,
    store: IncidentStore = Depends(get_incident_store),
):
    try:
        parsed_id = UUID(incident_id)
    except ValueError:
        return JSONResponse(
            {"error": {"field": "id", "message": "El identificador de incidencia no es válido."}},
            status_code=400,
        )

    payload = await _read_json(request)
    if isinstance(payload, JSONResponse):
        return payload
    try:
        status_payload = IncidentStatusPayload.model_validate(payload)
    except ValidationError as error:
        return _validation_error(error)

    incident = store.get(parsed_id)
    if incident is None:
        return JSONResponse(
            {"error": {"field": "id", "message": "Incidencia no encontrada."}},
            status_code=404,
        )
    if status_payload.status not in STATUS_TRANSITIONS[incident.status]:
        return JSONResponse(
            {
                "error": {
                    "field": "status",
                    "message": f"No se puede cambiar el estado de {incident.status} a {status_payload.status}.",
                }
            },
            status_code=400,
        )
    return store.update_status(parsed_id, status_payload.status)
