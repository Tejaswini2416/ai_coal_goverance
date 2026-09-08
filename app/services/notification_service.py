"""
Notification Delivery & Acknowledgment Service — ⭐⭐⭐⭐⭐
Supports in-app, simulated email/SMS delivery, manager acknowledgment recording,
and Higher Authority escalation monitoring.
"""
from datetime import datetime, timezone
import uuid
from uuid import UUID
from fastapi import HTTPException

from app.infrastructure.database.models import NotificationModel
from app.infrastructure.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, notif_repo: NotificationRepository) -> None:
        self._repo = notif_repo

    async def emit_alert(
        self,
        mine_site_id: UUID,
        title: str,
        message: str,
        category: str,
        severity: str = "URGENT",
        recipient_user_id: UUID | None = None,
        recipient_role: str | None = None,
        channel: str = "IN_APP",
        escalation_level: int = 0,
    ) -> NotificationModel:
        notif = NotificationModel(
            id=uuid.uuid4(),
            recipient_user_id=recipient_user_id,
            recipient_role=recipient_role,
            mine_site_id=mine_site_id,
            title=title,
            message=message,
            category=category,
            severity=severity,
            channel=channel,
            escalation_level=escalation_level,
        )
        return await self._repo.create(notif)

    async def acknowledge_notification(
        self,
        notification_id: UUID,
        acknowledged_by: UUID,
        acknowledged_by_name: str,
        acknowledgement_note: str,
    ) -> NotificationModel:
        notif = await self._repo.get_by_id(notification_id)
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found.")

        notif.is_acknowledged = True
        notif.is_read = True
        notif.acknowledged_by = acknowledged_by
        notif.acknowledged_by_name = acknowledged_by_name
        notif.acknowledged_at = datetime.now(tz=timezone.utc)
        notif.acknowledgement_note = acknowledgement_note

        return await self._repo.update(notif)

    async def mark_as_read(self, notification_id: UUID) -> NotificationModel:
        notif = await self._repo.get_by_id(notification_id)
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found.")
        notif.is_read = True
        return await self._repo.update(notif)

    async def get_escalations_for_higher_authorities(self) -> list[NotificationModel]:
        """Fetch all unacknowledged escalated alerts across subsidiaries/mines for Ministry oversight."""
        return await self._repo.list_escalations(min_level=1)
