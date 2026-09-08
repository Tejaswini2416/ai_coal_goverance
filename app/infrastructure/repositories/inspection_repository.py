"""Inspection Repository — Beanie/MongoDB."""
from uuid import UUID

from app.infrastructure.database.models import InspectionModel


class InspectionRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, inspection_id: UUID) -> InspectionModel | None:
        return await InspectionModel.find_one(InspectionModel.id == inspection_id)

    async def get_by_idempotency_key(self, key: UUID) -> InspectionModel | None:
        return await InspectionModel.find_one(InspectionModel.idempotency_key == key)

    async def list_by_mine_site(
        self, mine_site_id: UUID | None = None, limit: int = 50, offset: int = 0
    ) -> list[InspectionModel]:
        query = (
            InspectionModel.find(InspectionModel.mine_site_id == mine_site_id)
            if mine_site_id
            else InspectionModel.find()
        )
        return (
            await query
            .sort(-InspectionModel.inspection_date)
            .skip(offset)
            .limit(limit)
            .to_list()
        )

    async def list_geofence_breaches(self, mine_site_id: UUID) -> list[InspectionModel]:
        return await InspectionModel.find(
            InspectionModel.mine_site_id == mine_site_id,
            InspectionModel.is_geofence_breached == True,  # noqa: E712
        ).to_list()

    async def create(self, inspection: InspectionModel) -> InspectionModel:
        await inspection.insert()
        return inspection

    async def update(self, inspection: InspectionModel) -> InspectionModel:
        await inspection.save()
        return inspection

    async def get_for_update(self, inspection_id: UUID) -> InspectionModel | None:
        """In MongoDB, no row-level lock; just fetch by id."""
        return await InspectionModel.find_one(InspectionModel.id == inspection_id)
