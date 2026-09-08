"""Inspection Schedules & Assignments API Router."""
from datetime import date, datetime
from typing import Optional
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import (
    CurrentUser,
    get_schedule_repo,
    get_schedule_service,
)
from app.infrastructure.database.models import InspectionScheduleModel
from app.infrastructure.repositories.schedule_repository import ScheduleRepository
from app.services.schedule_service import ScheduleService

router = APIRouter(prefix="/schedules", tags=["Inspection Schedules"])


class ScheduleCreate(BaseModel):
    mine_site_id: UUID
    assigned_inspector_id: UUID
    inspector_name: str
    inspection_title: str
    inspection_type: str = "SAFETY_AUDIT"
    scheduled_date: date
    due_date: date
    priority: str = "HIGH"
    notes: Optional[str] = None


class ScheduleStatusUpdate(BaseModel):
    status: str
    completed_inspection_id: Optional[UUID] = None
    notes: Optional[str] = None


class ScheduleOut(BaseModel):
    id: UUID
    mine_site_id: UUID
    assigned_inspector_id: UUID
    inspector_name: str
    inspection_title: str
    inspection_type: str
    scheduled_date: date
    due_date: date
    status: str
    priority: str
    completed_inspection_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("", response_model=ScheduleOut, status_code=201)
async def create_schedule(
    body: ScheduleCreate,
    user: CurrentUser,
    svc: ScheduleService = Depends(get_schedule_service),
):
    return await svc.create_schedule(
        mine_site_id=body.mine_site_id,
        assigned_inspector_id=body.assigned_inspector_id,
        inspector_name=body.inspector_name,
        inspection_title=body.inspection_title,
        inspection_type=body.inspection_type,
        scheduled_date=body.scheduled_date,
        due_date=body.due_date,
        priority=body.priority,
        notes=body.notes,
    )


@router.get("", response_model=list[ScheduleOut])
async def list_schedules(
    mine_site_id: Optional[UUID] = Query(None),
    inspector_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0),
    user: CurrentUser = ...,
    repo: ScheduleRepository = Depends(get_schedule_repo),
):
    return await repo.list_schedules(
        mine_site_id=mine_site_id,
        inspector_id=inspector_id,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.patch("/{schedule_id}/status", response_model=ScheduleOut)
async def update_schedule_status(
    schedule_id: UUID,
    body: ScheduleStatusUpdate,
    user: CurrentUser,
    repo: ScheduleRepository = Depends(get_schedule_repo),
    svc: ScheduleService = Depends(get_schedule_service),
):
    schedule = await repo.get_by_id(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    if body.status == "COMPLETED" and body.completed_inspection_id:
        return await svc.mark_completed(schedule_id, body.completed_inspection_id)

    schedule.status = body.status
    if body.completed_inspection_id:
        schedule.completed_inspection_id = body.completed_inspection_id
    if body.notes:
        schedule.notes = body.notes
    schedule.updated_at = datetime.utcnow()
    return await repo.update(schedule)


@router.post("/check-overdue")
async def check_overdue_schedules(
    user: CurrentUser,
    svc: ScheduleService = Depends(get_schedule_service),
):
    escalated_count = await svc.evaluate_overdue_schedules()
    return {"status": "ok", "escalated_count": escalated_count}
