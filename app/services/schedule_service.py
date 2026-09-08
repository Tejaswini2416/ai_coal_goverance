"""
Inspection Scheduling & Assignment Service — Core Lifecycle.
Handles assignment, due-date tracking, completion linkage, and overdue escalation.
"""
from datetime import date, datetime, timezone
import uuid
from uuid import UUID

from fastapi import HTTPException

from app.infrastructure.database.models import InspectionScheduleModel, NotificationModel
from app.infrastructure.repositories.schedule_repository import ScheduleRepository
from app.infrastructure.repositories.notification_repository import NotificationRepository


def _today() -> date:
    return datetime.now(tz=timezone.utc).date()


class ScheduleService:
    def __init__(
        self,
        schedule_repo: ScheduleRepository,
        notification_repo: NotificationRepository,
    ) -> None:
        self._schedule_repo = schedule_repo
        self._notif_repo = notification_repo

    async def create_schedule(
        self,
        mine_site_id: UUID,
        assigned_inspector_id: UUID,
        inspector_name: str,
        inspection_title: str,
        inspection_type: str,
        scheduled_date: date,
        due_date: date,
        priority: str = "HIGH",
        notes: str | None = None,
    ) -> InspectionScheduleModel:
        schedule = InspectionScheduleModel(
            id=uuid.uuid4(),
            mine_site_id=mine_site_id,
            assigned_inspector_id=assigned_inspector_id,
            inspector_name=inspector_name,
            inspection_title=inspection_title,
            inspection_type=inspection_type,
            scheduled_date=scheduled_date,
            due_date=due_date,
            status="ASSIGNED",
            priority=priority,
            notes=notes,
        )
        created = await self._schedule_repo.create(schedule)

        # Emit assignment notification directly to the inspector
        notif = NotificationModel(
            id=uuid.uuid4(),
            recipient_user_id=assigned_inspector_id,
            recipient_role="DGMS_INSPECTOR",
            mine_site_id=mine_site_id,
            title=f"New Inspection Assignment: {inspection_title}",
            message=(
                f"You have been assigned for {inspection_type} at mine {mine_site_id}. "
                f"Due Date: {due_date.isoformat()}. Priority: {priority}."
            ),
            category="INSPECTION_ASSIGNMENT",
            severity="URGENT" if priority in ("HIGH", "CRITICAL") else "INFO",
            channel="IN_APP",
        )
        await self._notif_repo.create(notif)

        return created

    async def mark_completed(
        self, schedule_id: UUID, completed_inspection_id: UUID
    ) -> InspectionScheduleModel:
        schedule = await self._schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found.")

        schedule.status = "COMPLETED"
        schedule.completed_inspection_id = completed_inspection_id
        schedule.completed_at = datetime.now(tz=timezone.utc)
        schedule.updated_at = datetime.now(tz=timezone.utc)
        return await self._schedule_repo.update(schedule)

    async def evaluate_overdue_schedules(self) -> int:
        """Find past-due uncompleted inspections, mark OVERDUE, and escalate to authorities."""
        today = _today()
        overdue_items = await self._schedule_repo.get_overdue_schedules(today)
        count = 0

        for item in overdue_items:
            if item.status != "OVERDUE":
                item.status = "OVERDUE"
                item.updated_at = datetime.now(tz=timezone.utc)
                await self._schedule_repo.update(item)
                count += 1

                # Send High-Priority Escalation Alert to Higher Authority (Ministry Auditor / Colliery Manager)
                notif = NotificationModel(
                    id=uuid.uuid4(),
                    recipient_role="COLLIERY_MANAGER",
                    mine_site_id=item.mine_site_id,
                    title=f"OVERDUE Statutory Inspection: {item.inspection_title}",
                    message=(
                        f"Inspection was due on {item.due_date.isoformat()} by inspector {item.inspector_name} "
                        f"but has not been performed. Automatic escalation level 1 initiated."
                    ),
                    category="INSPECTION_OVERDUE",
                    severity="CRITICAL",
                    channel="EMAIL",
                    escalation_level=1,
                    escalated_to_role="MINISTRY_AUDITOR",
                )
                await self._notif_repo.create(notif)

        return count
