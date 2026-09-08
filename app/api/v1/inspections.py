"""Inspections router — CRUD with dual-mode location."""
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, model_validator

from app.dependencies import (
    CurrentUser,
    get_geofence_service, get_audit_service, get_inspection_repo,
)
from app.domain.enums import LocationType, AuditEntityType, AuditOperation
from app.infrastructure.repositories.inspection_repository import InspectionRepository
from app.infrastructure.database.models import InspectionModel
from app.services.geofence_service import GeofenceService
from app.services.audit_service import AuditService
from datetime import datetime, timezone

router = APIRouter(prefix="/inspections", tags=["Inspections"])


class InspectionCreate(BaseModel):
    id:               UUID | None = None
    mine_site_id:     UUID
    title:            str
    description:      str
    location_type:    LocationType = LocationType.SURFACE_GPS
    gps_location:     str | None = None
    station_id:       str | None = None
    inspection_date:  datetime
    idempotency_key:  UUID | None = None

    @model_validator(mode="after")
    def validate_location(self):
        if self.location_type == LocationType.SURFACE_GPS and not self.gps_location:
            raise ValueError("gps_location required for SURFACE_GPS")
        if self.location_type == LocationType.UNDERGROUND_STATION and not self.station_id:
            raise ValueError("station_id required for UNDERGROUND_STATION")
        return self


class InspectionOut(BaseModel):
    id:                   UUID
    mine_site_id:         UUID
    inspector_id:         UUID
    title:                str
    description:          str
    location_type:        str
    station_id:           str | None
    is_geofence_breached: bool
    version:              int
    inspection_date:      datetime
    risk_score:           int | None
    created_at:           datetime

    class Config:
        from_attributes = True


@router.post("", response_model=InspectionOut, status_code=201)
async def create_inspection(
    body:          InspectionCreate,
    user:          CurrentUser,
    geofence_svc:  GeofenceService   = Depends(get_geofence_service),
    audit_svc:     AuditService      = Depends(get_audit_service),
    repo:          InspectionRepository = Depends(get_inspection_repo),
):
    breached, _ = await geofence_svc.validate(
        mine_site_id  = body.mine_site_id,
        location_type = body.location_type,
        gps_location  = body.gps_location,
        station_id    = body.station_id,
    )
    inspection = InspectionModel(
        id                   = body.id or uuid.uuid4(),
        mine_site_id         = body.mine_site_id,
        inspector_id         = UUID(user["user_id"]),
        title                = body.title,
        description          = body.description,
        location_type        = body.location_type.value,
        gps_location         = body.gps_location,
        station_id           = body.station_id,
        is_geofence_breached = breached,
        version              = 1,
        idempotency_key      = body.idempotency_key or uuid.uuid4(),
        last_idempotency_key = body.idempotency_key,
        inspection_date      = body.inspection_date,
    )
    created = await repo.create(inspection)
    from app.infrastructure.repositories.audit_ledger_repository import AuditLedgerRepository
    await audit_svc.append(
        mine_site_id = body.mine_site_id,
        entity_type  = AuditEntityType.INSPECTION,
        entity_id    = created.id,
        operation    = AuditOperation.INSERT,
        payload      = {"title": body.title, "mine_site_id": str(body.mine_site_id)},
        actor_id     = UUID(user["user_id"]),
    )
    return created


@router.get("", response_model=list[InspectionOut])
async def list_inspections(
    mine_site_id: UUID | None = Query(None),
    limit:        int         = Query(50, le=200),
    offset:       int         = Query(0),
    user:         CurrentUser = ...,
    repo:         InspectionRepository = Depends(get_inspection_repo),
):
    return await repo.list_by_mine_site(mine_site_id, limit=limit, offset=offset)


@router.get("/{inspection_id}", response_model=InspectionOut)
async def get_inspection(
    inspection_id: UUID,
    user:          CurrentUser,
    repo:          InspectionRepository = Depends(get_inspection_repo),
):
    rec = await repo.get_by_id(inspection_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    return rec
