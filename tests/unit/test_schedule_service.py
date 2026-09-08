"""Unit tests for ScheduleService: creation, completion, overdue escalation."""
import uuid
from datetime import date, timedelta
import pytest

from app.infrastructure.repositories.schedule_repository import ScheduleRepository
from app.infrastructure.repositories.notification_repository import NotificationRepository
from app.services.schedule_service import ScheduleService


@pytest.mark.asyncio
async def test_create_schedule_emits_notification(mine_site, inspector_user):
    schedule_repo = ScheduleRepository()
    notif_repo = NotificationRepository()
    service = ScheduleService(schedule_repo, notif_repo)

    today = date.today()
    due = today + timedelta(days=7)

    schedule = await service.create_schedule(
        mine_site_id=mine_site.id,
        assigned_inspector_id=inspector_user.id,
        inspector_name=inspector_user.full_name,
        inspection_title="Quarterly Shaft Audit",
        inspection_type="SAFETY_AUDIT",
        scheduled_date=today,
        due_date=due,
        priority="HIGH",
    )

    assert schedule.id is not None
    assert schedule.status == "ASSIGNED"
    assert schedule.inspection_title == "Quarterly Shaft Audit"

    # Verify notification was generated for the inspector
    notifs = await notif_repo.list_for_user_or_role(user_id=inspector_user.id)
    assert len(notifs) >= 1
    assert "Quarterly Shaft Audit" in notifs[0].title


@pytest.mark.asyncio
async def test_mark_completed(mine_site, inspector_user):
    schedule_repo = ScheduleRepository()
    notif_repo = NotificationRepository()
    service = ScheduleService(schedule_repo, notif_repo)

    schedule = await service.create_schedule(
        mine_site_id=mine_site.id,
        assigned_inspector_id=inspector_user.id,
        inspector_name=inspector_user.full_name,
        inspection_title="Ventilation Check",
        inspection_type="VENTILATION_CHECK",
        scheduled_date=date.today(),
        due_date=date.today() + timedelta(days=3),
    )

    inspection_id = uuid.uuid4()
    completed = await service.mark_completed(schedule.id, inspection_id)

    assert completed.status == "COMPLETED"
    assert completed.completed_inspection_id == inspection_id
    assert completed.completed_at is not None


@pytest.mark.asyncio
async def test_evaluate_overdue_schedules(mine_site, inspector_user):
    schedule_repo = ScheduleRepository()
    notif_repo = NotificationRepository()
    service = ScheduleService(schedule_repo, notif_repo)

    # Create past-due schedule
    past_date = date.today() - timedelta(days=5)
    schedule = await service.create_schedule(
        mine_site_id=mine_site.id,
        assigned_inspector_id=inspector_user.id,
        inspector_name=inspector_user.full_name,
        inspection_title="Overdue Slope Stability",
        inspection_type="SLOPE_STABILITY",
        scheduled_date=past_date - timedelta(days=2),
        due_date=past_date,
    )

    escalated = await service.evaluate_overdue_schedules()
    assert escalated >= 1

    updated = await schedule_repo.get_by_id(schedule.id)
    assert updated.status == "OVERDUE"

    # Verify escalation alert was created
    escalations = await notif_repo.list_escalations(min_level=1)
    assert len(escalations) >= 1
    assert any("Overdue Slope Stability" in e.title for e in escalations)
