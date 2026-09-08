"""
Batch Sync Service — Refinement 4 (Optimistic Versioning).
Handles POST /api/v1/sync/batch with:
  - Client-generated UUIDv4 primary keys
  - Idempotency via idempotency_key
  - Optimistic concurrency control via monotonic version counter
  - Conflict logging to sync_conflict_log for manual arbitration
  - Partial success semantics (HTTP 207)
"""
import uuid
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums import (
    AuditEntityType,
    AuditOperation,
    CAPAState,
    ConflictStatus,
    LocationType,
    SyncEntityType,
    SyncStatus,
)
from app.infrastructure.database.models import (
    InspectionModel,
    SyncConflictLogModel,
    ViolationCAPAModel,
)
from app.infrastructure.repositories.capa_repository import CAPARepository
from app.infrastructure.repositories.inspection_repository import InspectionRepository
from app.infrastructure.repositories.sync_conflict_repository import SyncConflictRepository
from app.services.audit_service import AuditService
from app.services.geofence_service import GeofenceService


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


# ── Pydantic Request Schemas ──────────────────────────────────────────────────

class SyncInspectionItem(BaseModel):
    id:                UUID
    idempotency_key:   UUID
    mine_site_id:      UUID
    title:             str
    description:       str
    location_type:     LocationType = LocationType.SURFACE_GPS
    gps_location:      str | None = None
    station_id:        str | None = None
    inspection_date:   datetime
    version:           int = Field(ge=1, description="Client's last-known server version")
    client_updated_at: datetime | None = None


class SyncCAPAItem(BaseModel):
    id:                UUID
    idempotency_key:   UUID
    inspection_id:     UUID
    rule_id:           UUID
    capa_state:        CAPAState = CAPAState.REPORTED
    description:       str
    evidence_urls:     list[str] = Field(default_factory=list)
    version:           int = Field(ge=1, description="Client's last-known server version")
    client_updated_at: datetime | None = None


class BatchSyncRequest(BaseModel):
    inspections:    list[SyncInspectionItem] = Field(default_factory=list)
    violation_capas: list[SyncCAPAItem]      = Field(default_factory=list)


# ── Pydantic Response Schemas ─────────────────────────────────────────────────

class SyncItemResult(BaseModel):
    id:             UUID
    status:         SyncStatus
    new_version:    int | None = None
    conflict_id:    UUID | None = None
    client_version: int | None = None
    server_version: int | None = None


class BatchSyncResponse(BaseModel):
    processed_at: datetime
    results:      list[SyncItemResult]
    summary:      dict[str, int]


# ── Diff Helper ────────────────────────────────────────────────────────────────
def _compute_diff(server_dict: dict, client_dict: dict) -> dict:
    """
    Field-level diff: { field: [client_val, server_val] }
    Only includes fields that differ between client and server snapshots.
    """
    diff = {}
    all_keys = set(server_dict.keys()) | set(client_dict.keys())
    for key in all_keys:
        sv = server_dict.get(key)
        cv = client_dict.get(key)
        if sv != cv:
            diff[key] = [cv, sv]  # [client_value, server_value]
    return diff


def _model_to_dict(model: Any) -> dict:
    """Serialize Beanie Document to dict for snapshot storage."""
    try:
        return model.model_dump(mode="json")
    except Exception:
        return {}


# ── Sync Service ──────────────────────────────────────────────────────────────

class SyncService:
    def __init__(
        self,
        inspection_repo: InspectionRepository,
        capa_repo:       CAPARepository,
        conflict_repo:   SyncConflictRepository,
        geofence_svc:    GeofenceService,
        audit_svc:       AuditService,
    ) -> None:
        self._inspection_repo = inspection_repo
        self._capa_repo       = capa_repo
        self._conflict_repo   = conflict_repo
        self._geofence        = geofence_svc
        self._audit           = audit_svc

    async def process_batch(
        self,
        request:  BatchSyncRequest,
        actor_id: UUID,
    ) -> BatchSyncResponse:
        results: list[SyncItemResult] = []

        # Process inspections
        for item in request.inspections:
            result = await self._upsert_inspection(item, actor_id)
            results.append(result)

        # Process CAPAs
        for item in request.violation_capas:
            result = await self._upsert_capa(item, actor_id)
            results.append(result)

        # Build summary
        summary = {
            "total":      len(results),
            "created":    sum(1 for r in results if r.status == SyncStatus.CREATED),
            "updated":    sum(1 for r in results if r.status == SyncStatus.UPDATED),
            "conflicts":  sum(1 for r in results if r.status == SyncStatus.CONFLICT),
            "duplicates": sum(1 for r in results if r.status == SyncStatus.DUPLICATE),
        }

        return BatchSyncResponse(
            processed_at=_utcnow(),
            results=results,
            summary=summary,
        )

    # ── Inspection Upsert ─────────────────────────────────────────────────────
    async def _upsert_inspection(
        self, item: SyncInspectionItem, actor_id: UUID
    ) -> SyncItemResult:
        existing = await self._inspection_repo.get_by_id(item.id)

        if existing:
            # ── Idempotency Guard: same key + same version = already processed ──
            if (
                existing.last_idempotency_key == item.idempotency_key
                and existing.version == item.version
            ):
                return SyncItemResult(id=item.id, status=SyncStatus.DUPLICATE)

            # ── Optimistic Conflict: client is behind server ──────────────────
            if item.version < existing.version:
                diff     = _compute_diff(_model_to_dict(existing), item.model_dump())
                conflict = SyncConflictLogModel(
                    id              = uuid.uuid4(),
                    idempotency_key = item.idempotency_key,
                    entity_type     = SyncEntityType.INSPECTION.value,
                    entity_id       = item.id,
                    client_version  = item.version,
                    server_version  = existing.version,
                    client_payload  = item.model_dump(mode="json"),
                    server_snapshot = _model_to_dict(existing),
                    diff_json       = diff,
                    status          = ConflictStatus.PENDING_ARBITRATION.value,
                )
                await self._conflict_repo.create(conflict)
                return SyncItemResult(
                    id             = item.id,
                    status         = SyncStatus.CONFLICT,
                    conflict_id    = conflict.id,
                    client_version = item.version,
                    server_version = existing.version,
                )

            # ── Safe Merge: versions match ────────────────────────────────────
            if item.version == existing.version:
                existing.title             = item.title
                existing.description       = item.description
                existing.location_type     = item.location_type.value
                existing.gps_location      = item.gps_location
                existing.station_id        = item.station_id
                existing.inspection_date   = item.inspection_date
                existing.client_updated_at = item.client_updated_at
                existing.version          += 1
                existing.last_idempotency_key = item.idempotency_key
                existing.updated_at        = _utcnow()

                # Re-run geofence validation on update
                breached, _ = await self._geofence.validate(
                    mine_site_id  = existing.mine_site_id,
                    location_type = item.location_type,
                    gps_location  = item.gps_location,
                    station_id    = item.station_id,
                )
                existing.is_geofence_breached = breached

                await self._inspection_repo.update(existing)

                # Audit ledger entry
                await self._audit.append(
                    mine_site_id = existing.mine_site_id,
                    entity_type  = AuditEntityType.INSPECTION,
                    entity_id    = existing.id,
                    operation    = AuditOperation.UPDATE,
                    payload      = _model_to_dict(existing),
                    actor_id     = actor_id,
                )

                return SyncItemResult(
                    id=item.id, status=SyncStatus.UPDATED, new_version=existing.version
                )

        # ── New Record (offline-created by client) ────────────────────────────
        breached, _ = await self._geofence.validate(
            mine_site_id  = item.mine_site_id,
            location_type = item.location_type,
            gps_location  = item.gps_location,
            station_id    = item.station_id,
        )

        new_inspection = InspectionModel(
            id                   = item.id,
            mine_site_id         = item.mine_site_id,
            inspector_id         = actor_id,
            title                = item.title,
            description          = item.description,
            location_type        = item.location_type.value,
            gps_location         = item.gps_location,
            station_id           = item.station_id,
            is_geofence_breached = breached,
            version              = 1,
            idempotency_key      = item.idempotency_key,
            last_idempotency_key = item.idempotency_key,
            client_updated_at    = item.client_updated_at,
            inspection_date      = item.inspection_date,
        )
        await self._inspection_repo.create(new_inspection)

        # Audit ledger entry
        await self._audit.append(
            mine_site_id = item.mine_site_id,
            entity_type  = AuditEntityType.INSPECTION,
            entity_id    = item.id,
            operation    = AuditOperation.INSERT,
            payload      = _model_to_dict(new_inspection),
            actor_id     = actor_id,
        )

        return SyncItemResult(id=item.id, status=SyncStatus.CREATED, new_version=1)

    # ── CAPA Upsert ───────────────────────────────────────────────────────────
    async def _upsert_capa(
        self, item: SyncCAPAItem, actor_id: UUID
    ) -> SyncItemResult:
        existing = await self._capa_repo.get_by_id(item.id)

        if existing:
            if (
                existing.last_idempotency_key == item.idempotency_key
                and existing.version == item.version
            ):
                return SyncItemResult(id=item.id, status=SyncStatus.DUPLICATE)

            if item.version < existing.version:
                diff     = _compute_diff(_model_to_dict(existing), item.model_dump())
                conflict = SyncConflictLogModel(
                    id              = uuid.uuid4(),
                    idempotency_key = item.idempotency_key,
                    entity_type     = SyncEntityType.VIOLATION_CAPA.value,
                    entity_id       = item.id,
                    client_version  = item.version,
                    server_version  = existing.version,
                    client_payload  = item.model_dump(mode="json"),
                    server_snapshot = _model_to_dict(existing),
                    diff_json       = diff,
                    status          = ConflictStatus.PENDING_ARBITRATION.value,
                )
                await self._conflict_repo.create(conflict)
                return SyncItemResult(
                    id=item.id, status=SyncStatus.CONFLICT,
                    conflict_id=conflict.id,
                    client_version=item.version, server_version=existing.version,
                )

            if item.version == existing.version:
                existing.description       = item.description
                existing.evidence_urls     = item.evidence_urls
                existing.client_updated_at = item.client_updated_at
                existing.version          += 1
                existing.last_idempotency_key = item.idempotency_key
                existing.updated_at        = _utcnow()
                await self._capa_repo.update(existing)
                return SyncItemResult(id=item.id, status=SyncStatus.UPDATED, new_version=existing.version)

        new_capa = ViolationCAPAModel(
            id                   = item.id,
            inspection_id        = item.inspection_id,
            rule_id              = item.rule_id,
            capa_state           = item.capa_state.value,
            description          = item.description,
            evidence_urls        = item.evidence_urls,
            version              = 1,
            idempotency_key      = item.idempotency_key,
            last_idempotency_key = item.idempotency_key,
            client_updated_at    = item.client_updated_at,
        )
        await self._capa_repo.create(new_capa)
        return SyncItemResult(id=item.id, status=SyncStatus.CREATED, new_version=1)
