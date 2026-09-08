"""Inspection Schedule Repository — Beanie/MongoDB."""
from datetime import date, datetime
from uuid import UUID
from app.infrastructure.database.models import InspectionScheduleModel


class ScheduleRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, schedule_id: UUID) -> InspectionScheduleModel | None:
        return await InspectionScheduleModel.find_one(InspectionScheduleModel.id == schedule_id)

    async def list_schedules(
        self,
        mine_site_id: UUID | None = None,
        inspector_id: UUID | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[InspectionScheduleModel]:
        queries = []
        if mine_site_id:
            queries.append(InspectionScheduleModel.mine_site_id == mine_site_id)
        if inspector_id:
            queries.append(InspectionScheduleModel.assigned_inspector_id == inspector_id)
        if status:
            queries.append(InspectionScheduleModel.status == status)

        query = InspectionScheduleModel.find(*queries) if queries else InspectionScheduleModel.find()
        return (
            await query
            .sort(+InspectionScheduleModel.due_date)
            .skip(offset)
            .limit(limit)
            .to_list()
        )

    async def get_overdue_schedules(self, reference_date: date) -> list[InspectionScheduleModel]:
        """Fetch uncompleted schedules past their due date."""
        return await InspectionScheduleModel.find(
            InspectionScheduleModel.due_date < reference_date,
            InspectionScheduleModel.status != "COMPLETED",
        ).to_list()

    async def create(self, schedule: InspectionScheduleModel) -> InspectionScheduleModel:
        await schedule.insert()
        return schedule

    async def update(self, schedule: InspectionScheduleModel) -> InspectionScheduleModel:
        await schedule.save()
        return schedule
