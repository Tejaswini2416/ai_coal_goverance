"""
Unit tests — Sync Service Optimistic Versioning (Refinement 4).
Tests: CREATED, UPDATED (safe merge), CONFLICT (stale version), DUPLICATE.
"""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.domain.enums import SyncStatus, LocationType
from app.services.sync_service import SyncService, SyncInspectionItem, BatchSyncRequest


def _utcnow():
    return datetime.now(tz=timezone.utc)


def _make_service(
    existing_inspection=None,
    existing_capa=None,
):
    inspection_repo = MagicMock()
    inspection_repo.get_by_id = AsyncMock(return_value=existing_inspection)
    inspection_repo.create    = AsyncMock(side_effect=lambda x: x)
    inspection_repo.update    = AsyncMock(side_effect=lambda x: x)

    capa_repo = MagicMock()
    capa_repo.get_by_id = AsyncMock(return_value=existing_capa)
    capa_repo.create    = AsyncMock(side_effect=lambda x: x)
    capa_repo.update    = AsyncMock(side_effect=lambda x: x)

    conflict_repo = MagicMock()
    conflict_repo.create = AsyncMock(side_effect=lambda x: x)

    geofence_svc = MagicMock()
    geofence_svc.validate = AsyncMock(return_value=(False, None))

    audit_svc = MagicMock()
    audit_svc.append = AsyncMock()

    return SyncService(inspection_repo, capa_repo, conflict_repo, geofence_svc, audit_svc)


def _make_item(version=1, idempotency_key=None, record_id=None) -> SyncInspectionItem:
    return SyncInspectionItem(
        id               = record_id or uuid.uuid4(),
        idempotency_key  = idempotency_key or uuid.uuid4(),
        mine_site_id     = uuid.uuid4(),
        title            = "Test Inspection",
        description      = "Description",
        location_type    = LocationType.SURFACE_GPS,
        gps_location     = "POINT(82.5 21.5)",
        inspection_date  = _utcnow(),
        version          = version,
    )


# ── CREATED ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_new_record_returns_created():
    """No existing record → CREATED with version=1."""
    svc    = _make_service(existing_inspection=None)
    item   = _make_item(version=1)
    result = await svc._upsert_inspection(item, uuid.uuid4())

    assert result.status   == SyncStatus.CREATED
    assert result.new_version == 1


# ── UPDATED (safe merge) ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_matching_version_returns_updated():
    """Existing version=3, client sends version=3 → safe merge, version bumped to 4."""
    record_id     = uuid.uuid4()
    idempotency   = uuid.uuid4()
    existing      = MagicMock()
    existing.id                   = record_id
    existing.version              = 3
    existing.last_idempotency_key = uuid.uuid4()   # different key
    existing.mine_site_id         = uuid.uuid4()
    existing.updated_at           = None

    svc    = _make_service(existing_inspection=existing)
    item   = _make_item(version=3, record_id=record_id)
    result = await svc._upsert_inspection(item, uuid.uuid4())

    assert result.status      == SyncStatus.UPDATED
    assert result.new_version == 4
    assert existing.version   == 4


# ── CONFLICT (stale version) ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_stale_version_returns_conflict():
    """Client sends version=2 but server is at version=5 → CONFLICT logged."""
    record_id = uuid.uuid4()
    existing  = MagicMock()
    existing.id                   = record_id
    existing.version              = 5
    existing.model_dump           = MagicMock(return_value={"id": str(record_id), "version": 5})

    svc    = _make_service(existing_inspection=existing)
    item   = _make_item(version=2, record_id=record_id)
    result = await svc._upsert_inspection(item, uuid.uuid4())

    assert result.status         == SyncStatus.CONFLICT
    assert result.client_version == 2
    assert result.server_version == 5
    assert result.conflict_id    is not None


# ── DUPLICATE ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_same_idempotency_key_and_version_returns_duplicate():
    """Same idempotency_key + same version → DUPLICATE (already processed)."""
    record_id     = uuid.uuid4()
    idem_key      = uuid.uuid4()
    existing      = MagicMock()
    existing.id                   = record_id
    existing.version              = 3
    existing.last_idempotency_key = idem_key   # ← same!

    svc    = _make_service(existing_inspection=existing)
    item   = _make_item(version=3, idempotency_key=idem_key, record_id=record_id)
    result = await svc._upsert_inspection(item, uuid.uuid4())

    assert result.status == SyncStatus.DUPLICATE


# ── Mixed Batch ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_batch_summary_correct():
    """Batch with 1 new + 1 conflict → summary totals are correct."""
    new_id      = uuid.uuid4()
    conflict_id = uuid.uuid4()

    existing = MagicMock()
    existing.id                   = conflict_id
    existing.version              = 10
    existing.last_idempotency_key = uuid.uuid4()
    existing.model_dump           = MagicMock(return_value={"id": str(conflict_id), "version": 10})

    # Patch get_by_id to return None for new_id, existing for conflict_id
    inspection_repo = MagicMock()
    async def _get(record_id):
        return existing if record_id == conflict_id else None
    inspection_repo.get_by_id = _get
    inspection_repo.create    = AsyncMock(side_effect=lambda x: x)

    conflict_repo = MagicMock()
    conflict_repo.create = AsyncMock(side_effect=lambda x: x)

    geofence_svc = MagicMock()
    geofence_svc.validate = AsyncMock(return_value=(False, None))

    audit_svc = MagicMock()
    audit_svc.append = AsyncMock()

    capa_repo = MagicMock()
    svc = SyncService(inspection_repo, capa_repo, conflict_repo, geofence_svc, audit_svc)

    items = [
        _make_item(version=1, record_id=new_id),
        _make_item(version=1, record_id=conflict_id),  # stale vs server v10
    ]
    request = BatchSyncRequest(inspections=items)
    response = await svc.process_batch(request, uuid.uuid4())

    assert response.summary["created"]   == 1
    assert response.summary["conflicts"] == 1
    assert response.summary["total"]     == 2
