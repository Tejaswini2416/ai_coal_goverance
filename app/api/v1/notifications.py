"""Notifications & Multi-Channel Alert Acknowledgment API Router."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import (
    CurrentUser,
    get_notif_repo,
    get_notification_service,
)
from app.infrastructure.database.models import NotificationModel
from app.infrastructure.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


class NotificationAcknowledgeRequest(BaseModel):
    acknowledgement_note: str


class NotificationOut(BaseModel):
    id: UUID
    recipient_user_id: Optional[UUID] = None
    recipient_role: Optional[str] = None
    mine_site_id: UUID
    title: str
    message: str
    category: str
    severity: str
    channel: str
    is_read: bool
    is_acknowledged: bool
    acknowledged_by: Optional[UUID] = None
    acknowledged_by_name: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    acknowledgement_note: Optional[str] = None
    escalation_level: int
    escalated_to_role: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    mine_site_id: Optional[UUID] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    user: CurrentUser = ...,
    repo: NotificationRepository = Depends(get_notif_repo),
):
    current_user_id = UUID(user["user_id"]) if "user_id" in user else None
    role = user.get("role")
    
    # DGMS_INSPECTOR or COLLIERY_MANAGER or MINISTRY_AUDITOR
    return await repo.list_for_user_or_role(
        user_id=current_user_id,
        role=role,
        mine_site_id=mine_site_id,
        is_acknowledged=is_acknowledged,
        limit=limit,
    )


@router.post("/{notification_id}/acknowledge", response_model=NotificationOut)
async def acknowledge_notification(
    notification_id: UUID,
    body: NotificationAcknowledgeRequest,
    user: CurrentUser,
    svc: NotificationService = Depends(get_notification_service),
):
    user_id = UUID(user["user_id"])
    user_name = user.get("email", "Authorized User")
    return await svc.acknowledge_notification(
        notification_id=notification_id,
        acknowledged_by=user_id,
        acknowledged_by_name=user_name,
        acknowledgement_note=body.acknowledgement_note,
    )


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: UUID,
    user: CurrentUser,
    svc: NotificationService = Depends(get_notification_service),
):
    return await svc.mark_as_read(notification_id)


@router.get("/escalations", response_model=list[NotificationOut])
async def list_escalations(
    user: CurrentUser,
    svc: NotificationService = Depends(get_notification_service),
):
    """Feed for Ministry/Subsidiary Higher Authorities to monitor unacknowledged escalated alerts."""
    return await svc.get_escalations_for_higher_authorities()
