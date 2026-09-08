"""Compliance router — schedules and alerts."""
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import CurrentUser, get_compliance_repo
from app.infrastructure.repositories.compliance_repository import ComplianceRepository

router = APIRouter(prefix="/compliance", tags=["Compliance"])


class ScheduleOut(BaseModel):
    id:               UUID
    mine_site_id:     UUID
    rule_id:          UUID
    permit_number:    str
    permit_type:      str
    issued_date:      date
    expiry_date:      date
    status:           str
    last_alerted_days: int | None

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id:                UUID
    mine_site_id:      UUID
    schedule_id:       UUID
    severity:          str
    days_until_expiry: int
    is_acknowledged:   bool
    created_at:        datetime

    class Config:
        from_attributes = True


@router.get("/schedules", response_model=list[ScheduleOut])
async def list_schedules(
    mine_site_id: UUID = Query(...),
    user:         CurrentUser = ...,
    repo:         ComplianceRepository = Depends(get_compliance_repo),
):
    return await repo.list_by_mine(mine_site_id)


@router.get("/alerts", response_model=list[AlertOut])
async def list_alerts(
    mine_site_id:       UUID = Query(...),
    unacknowledged_only: bool = Query(False),
    user:               CurrentUser = ...,
    repo:               ComplianceRepository = Depends(get_compliance_repo),
):
    return await repo.list_alerts_by_mine(mine_site_id, unacknowledged_only=unacknowledged_only)


@router.post("/alerts/{alert_id}/acknowledge", status_code=200)
async def acknowledge_alert(
    alert_id: UUID,
    user:     CurrentUser,
    repo:     ComplianceRepository = Depends(get_compliance_repo),
):
    from app.infrastructure.database.models import ComplianceAlertModel
    alert = await ComplianceAlertModel.find_one(ComplianceAlertModel.id == alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_acknowledged = True
    alert.acknowledged_by = UUID(user["user_id"])
    alert.acknowledged_at = datetime.utcnow()
    await alert.save()
    return {"status": "acknowledged"}
