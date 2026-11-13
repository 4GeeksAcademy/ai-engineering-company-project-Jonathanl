"""TinyDB persistence for incidents and their source CSV identifiers."""

from datetime import datetime, timezone
from uuid import UUID

from tinydb import Query

from services.api.database import CompanyDatabase
from services.api.incident_models import Incident, IncidentCreate


class IncidentStore:
    def __init__(self, database: CompanyDatabase):
        self._table = database.table("incidents")
        self._lock = database.lock

    @staticmethod
    def _model_record(record: dict) -> Incident:
        # source_id is seed metadata, not part of the public Incident model.
        return Incident.model_validate({key: value for key, value in record.items() if key != "source_id"})

    def list(self) -> list[Incident]:
        with self._lock:
            records = self._table.all()
        return [self._model_record(record) for record in records]

    def get(self, incident_id: UUID) -> Incident | None:
        with self._lock:
            record = self._table.get(Query().id == str(incident_id))
        return self._model_record(record) if record is not None else None

    def exists_source_id(self, source_id: str) -> bool:
        with self._lock:
            return self._table.contains(Query().source_id == source_id)

    def create(
        self,
        incident: IncidentCreate,
        *,
        source_id: str | None = None,
        created_at: datetime | None = None,
    ) -> Incident:
        now = datetime.now(timezone.utc)
        record = Incident(
            **incident.model_dump(),
            created_at=created_at or now,
            updated_at=now,
        )
        stored = record.model_dump(mode="json")
        if source_id is not None:
            stored["source_id"] = source_id
        with self._lock:
            self._table.insert(stored)
        return record

    def update_status(self, incident_id: UUID, status: str) -> Incident | None:
        with self._lock:
            record = self._table.get(Query().id == str(incident_id))
            if record is None:
                return None
            incident = self._model_record(record)
            updated = incident.model_copy(
                update={"status": status, "updated_at": datetime.now(timezone.utc)}
            )
            stored = updated.model_dump(mode="json")
            if "source_id" in record:
                stored["source_id"] = record["source_id"]
            self._table.update(stored, doc_ids=[record.doc_id])
        return updated
