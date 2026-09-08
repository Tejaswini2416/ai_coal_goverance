"""Worker Attendance Repository — Beanie/MongoDB."""
from uuid import UUID
from datetime import datetime
from app.infrastructure.database.models import WorkerAttendanceModel


class AttendanceRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, attendance_id: UUID) -> WorkerAttendanceModel | None:
        return await WorkerAttendanceModel.find_one(WorkerAttendanceModel.id == attendance_id)

    async def list_by_mine_site(
        self, mine_site_id: UUID | None = None, limit: int = 100, offset: int = 0
    ) -> list[WorkerAttendanceModel]:
        query = (
            WorkerAttendanceModel.find(WorkerAttendanceModel.mine_site_id == mine_site_id)
            if mine_site_id
            else WorkerAttendanceModel.find()
        )
        return (
            await query
            .sort(-WorkerAttendanceModel.check_in_time)
            .skip(offset)
            .limit(limit)
            .to_list()
        )

    async def get_active_inside(self, mine_site_id: UUID) -> list[WorkerAttendanceModel]:
        return await WorkerAttendanceModel.find(
            WorkerAttendanceModel.mine_site_id == mine_site_id,
            WorkerAttendanceModel.status == "ACTIVE_INSIDE",
        ).to_list()

    async def create(self, record: WorkerAttendanceModel) -> WorkerAttendanceModel:
        await record.insert()
        return record

    async def update(self, record: WorkerAttendanceModel) -> WorkerAttendanceModel:
        await record.save()
        return record
