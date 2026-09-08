"""
Worker 1 — Compliance Monitor
Daily cron task scanning for upcoming statutory permit expirations.
Alert windows: 30, 15, 7, 1 days before expiry.
Generates ComplianceAlert records and marks schedules as EXPIRING.
"""
import asyncio
from datetime import date, timedelta

import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(
    name="app.workers.compliance_monitor.scan_permit_expirations",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def scan_permit_expirations(self):
    """
    Scan all ACTIVE/EXPIRING compliance schedules and emit alerts
    for permits expiring within the configured day windows.
    """
    asyncio.run(_async_scan())


async def _async_scan():
    from app.infrastructure.database.base import AsyncSessionLocal
    from app.infrastructure.repositories.compliance_repository import ComplianceRepository
    from app.infrastructure.database.models import ComplianceAlertModel, ComplianceScheduleModel
    from app.config import settings
    from app.domain.enums import AlertSeverity, ComplianceStatus
    import uuid

    today         = date.today()
    alert_windows = settings.alert_day_windows   # [30, 15, 7, 1]

    async with AsyncSessionLocal() as session:
        repo = ComplianceRepository(session)

        # Scan up to the furthest alert window
        max_days     = max(alert_windows)
        cutoff_date  = today + timedelta(days=max_days)
        schedules    = await repo.list_expiring_before(cutoff_date)

        alerts_created = 0
        for schedule in schedules:
            days_left = (schedule.expiry_date - today).days

            for window in sorted(alert_windows, reverse=True):
                if days_left <= window:
                    # Avoid duplicate alerts for the same window
                    already_exists = await repo.alert_exists(schedule.id, window)
                    if already_exists:
                        continue

                    severity = _severity_for_days(window)
                    alert = ComplianceAlertModel(
                        id               = uuid.uuid4(),
                        mine_site_id     = schedule.mine_site_id,
                        schedule_id      = schedule.id,
                        severity         = severity.value,
                        days_until_expiry = days_left,
                        is_acknowledged  = False,
                    )
                    await repo.create_alert(alert)
                    alerts_created += 1

                    # Update schedule status to EXPIRING
                    if schedule.status == ComplianceStatus.ACTIVE.value:
                        schedule.status = ComplianceStatus.EXPIRING.value
                        schedule.last_alerted_days = window
                    break   # Only the most urgent window per schedule per run

        await session.commit()
        logger.info(
            "compliance_monitor_complete",
            schedules_scanned=len(schedules),
            alerts_created=alerts_created,
            today=str(today),
        )


def _severity_for_days(days: int):
    from app.domain.enums import AlertSeverity
    if days <= 1:
        return AlertSeverity.CRITICAL
    if days <= 7:
        return AlertSeverity.HIGH
    if days <= 15:
        return AlertSeverity.MEDIUM
    return AlertSeverity.LOW
