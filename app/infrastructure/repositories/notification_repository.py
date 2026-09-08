"""Notification & Escalation Repository — Beanie/MongoDB."""
from datetime import datetime
from uuid import UUID
from app.infrastructure.database.models import NotificationModel


class NotificationRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, notification_id: UUID) -> NotificationModel | None:
        return await NotificationModel.find_one(NotificationModel.id == notification_id)

    async def list_for_user_or_role(
        self,
        user_id: UUID | None = None,
        role: str | None = None,
        mine_site_id: UUID | None = None,
        is_acknowledged: bool | None = None,
        limit: int = 50,
    ) -> list[NotificationModel]:
        from beanie.operators import Or
        conditions = []
        if mine_site_id:
            conditions.append(NotificationModel.mine_site_id == mine_site_id)
        if is_acknowledged is not None:
            conditions.append(NotificationModel.is_acknowledged == is_acknowledged)

        # For role/user visibility:
        # If user is MINISTRY_AUDITOR or role is None, they see all notifications for the site
        if role and role != "MINISTRY_AUDITOR":
            recipient_conditions = [
                NotificationModel.recipient_role == role,
                NotificationModel.recipient_role == None,
                NotificationModel.escalated_to_role == role,
            ]
            if user_id:
                recipient_conditions.append(NotificationModel.recipient_user_id == user_id)
                recipient_conditions.append(NotificationModel.recipient_user_id == None)
            conditions.append(Or(*recipient_conditions))

        query = NotificationModel.find(*conditions) if conditions else NotificationModel.find()
        return (
            await query
            .sort(-NotificationModel.created_at)
            .limit(limit)
            .to_list()
        )

    async def list_escalations(self, min_level: int = 1) -> list[NotificationModel]:
        """Fetch alerts escalated for Higher Authority oversight."""
        return (
            await NotificationModel.find(
                NotificationModel.escalation_level >= min_level,
                NotificationModel.is_acknowledged == False,  # noqa: E712
            )
            .sort(-NotificationModel.created_at)
            .to_list()
        )

    async def create(self, notif: NotificationModel) -> NotificationModel:
        await notif.insert()
        return notif

    async def update(self, notif: NotificationModel) -> NotificationModel:
        await notif.save()
        return notif
