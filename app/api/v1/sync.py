"""
POST /api/v1/sync/batch — Idempotent Offline Batch Synchronization
Returns HTTP 207 Multi-Status with per-item results.
"""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.dependencies import (
    CurrentUser,
    get_sync_service,
)
from app.services.sync_service import BatchSyncRequest, BatchSyncResponse, SyncService

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post(
    "/batch",
    status_code=status.HTTP_207_MULTI_STATUS,
    response_model=BatchSyncResponse,
    summary="Offline batch sync",
    description=(
        "Accepts arrays of inspections and violation_capas created offline on mobile clients. "
        "Each item is processed atomically with idempotency and optimistic concurrency control. "
        "Returns HTTP 207 with per-item status: CREATED | UPDATED | CONFLICT | DUPLICATE."
    ),
)
async def batch_sync(
    payload:   BatchSyncRequest,
    user:      CurrentUser,
    sync_svc:  SyncService = Depends(get_sync_service),
):
    from uuid import UUID
    actor_id = UUID(user["user_id"])
    response = await sync_svc.process_batch(payload, actor_id)
    # HTTP 207 Multi-Status — partial success
    return JSONResponse(
        status_code=207,
        content=response.model_dump(mode="json"),
    )


from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import HTTPException


class ArbitrateRequest(BaseModel):
    conflict_id:     UUID
    resolution:      str = Field(..., description="RESOLVED_CLIENT | RESOLVED_SERVER | AUTO_MERGED")
    merged_payload:  dict | None = None


class ArbitrateResponse(BaseModel):
    conflict_id:   UUID
    status:        str
    arbitrated_by: UUID
    arbitrated_at: datetime


@router.post(
    "/arbitrate",
    response_model=ArbitrateResponse,
    summary="Arbitrate sync conflict",
    description="Resolves a sync conflict logged during optimistic concurrency version clash.",
)
async def arbitrate_conflict(
    payload: ArbitrateRequest,
    user:    CurrentUser,
):
    from app.infrastructure.repositories.sync_conflict_repository import SyncConflictRepository
    repo = SyncConflictRepository()
    actor_id = UUID(user["user_id"])

    conflict = await repo.resolve(
        conflict_id=payload.conflict_id,
        resolution=payload.resolution,
        arbitrated_by=actor_id,
    )
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict record not found.")

    return ArbitrateResponse(
        conflict_id=conflict.id,
        status=conflict.status,
        arbitrated_by=conflict.arbitrated_by,
        arbitrated_at=conflict.arbitrated_at or datetime.utcnow(),
    )
