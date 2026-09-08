"""CAPA Repository — Beanie/MongoDB."""
from uuid import UUID

from app.infrastructure.database.models import ViolationCAPAModel


class CAPARepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, capa_id: UUID) -> ViolationCAPAModel | None:
        return await ViolationCAPAModel.find_one(ViolationCAPAModel.id == capa_id)

    async def get_by_idempotency_key(self, key: UUID) -> ViolationCAPAModel | None:
        return await ViolationCAPAModel.find_one(ViolationCAPAModel.idempotency_key == key)

    async def list_by_inspection(self, inspection_id: UUID) -> list[ViolationCAPAModel]:
        return (
            await ViolationCAPAModel.find(ViolationCAPAModel.inspection_id == inspection_id)
            .sort(-ViolationCAPAModel.created_at)
            .to_list()
        )

    async def list_by_mine_site(self, mine_site_id: UUID) -> list[ViolationCAPAModel]:
        # Look up inspections for this mine and find violations
        from app.infrastructure.database.models import InspectionModel
        inspections = await InspectionModel.find(InspectionModel.mine_site_id == mine_site_id).to_list()
        insp_ids = [i.id for i in inspections]
        if not insp_ids:
            return []
        return await ViolationCAPAModel.find({"inspection_id": {"$in": insp_ids}}).to_list()

    async def list_open_capas_for_mine(self, mine_site_id: UUID) -> list[ViolationCAPAModel]:
        violations = await self.list_by_mine_site(mine_site_id)
        return [v for v in violations if v.capa_state not in ("CLOSED", "VERIFIED")]

    async def list_by_state(
        self, capa_state: str, mine_site_id: UUID | None = None
    ) -> list[ViolationCAPAModel]:
        return await ViolationCAPAModel.find(
            ViolationCAPAModel.capa_state == capa_state
        ).to_list()

    async def list_all(self) -> list[ViolationCAPAModel]:
        return await ViolationCAPAModel.find().sort(-ViolationCAPAModel.created_at).to_list()

    async def create(self, capa: ViolationCAPAModel) -> ViolationCAPAModel:
        await capa.insert()
        return capa

    async def update(self, capa: ViolationCAPAModel) -> ViolationCAPAModel:
        await capa.save()
        return capa

    async def get_for_update(self, capa_id: UUID) -> ViolationCAPAModel | None:
        return await ViolationCAPAModel.find_one(ViolationCAPAModel.id == capa_id)
