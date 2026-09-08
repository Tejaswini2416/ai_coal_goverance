"""Compliance Schedule and Alert Repository — Beanie/MongoDB."""
from datetime import date
from uuid import UUID

from app.infrastructure.database.models import ComplianceAlertModel, ComplianceScheduleModel


class ComplianceRepository:
    def __init__(self) -> None:
        pass

    async def get_schedule_by_id(self, schedule_id: UUID) -> ComplianceScheduleModel | None:
        return await ComplianceScheduleModel.find_one(ComplianceScheduleModel.id == schedule_id)

    async def list_expiring_before(self, cutoff_date: date) -> list[ComplianceScheduleModel]:
        """Return ACTIVE schedules expiring on or before cutoff_date."""
        return (
            await ComplianceScheduleModel.find(
                ComplianceScheduleModel.expiry_date <= cutoff_date,
                ComplianceScheduleModel.status.in_(["ACTIVE", "EXPIRING"]),
            )
            .sort(ComplianceScheduleModel.expiry_date)
            .to_list()
        )

    async def list_by_mine(self, mine_site_id: UUID) -> list[ComplianceScheduleModel]:
        return await ComplianceScheduleModel.find(
            ComplianceScheduleModel.mine_site_id == mine_site_id
        ).to_list()

    async def create_schedule(
        self, schedule: ComplianceScheduleModel
    ) -> ComplianceScheduleModel:
        await schedule.insert()
        return schedule

    async def update_schedule(
        self, schedule: ComplianceScheduleModel
    ) -> ComplianceScheduleModel:
        await schedule.save()
        return schedule

    async def alert_exists(self, schedule_id: UUID, days_until_expiry: int) -> bool:
        existing = await ComplianceAlertModel.find_one(
            ComplianceAlertModel.schedule_id == schedule_id,
            ComplianceAlertModel.days_until_expiry == days_until_expiry,
        )
        return existing is not None

    async def create_alert(self, alert: ComplianceAlertModel) -> ComplianceAlertModel:
        await alert.insert()
        return alert

    async def list_alerts_by_mine(
        self, mine_site_id: UUID, unacknowledged_only: bool = False
    ) -> list[ComplianceAlertModel]:
        query = ComplianceAlertModel.find(
            ComplianceAlertModel.mine_site_id == mine_site_id
        )
        if unacknowledged_only:
            query = query.find(ComplianceAlertModel.is_acknowledged == False)  # noqa: E712
        return await query.sort(-ComplianceAlertModel.created_at).to_list()
