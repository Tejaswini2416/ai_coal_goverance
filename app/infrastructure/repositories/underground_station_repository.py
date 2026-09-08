"""Underground Station Repository — Beanie/MongoDB."""
from uuid import UUID

from app.infrastructure.database.models import MineUndergroundStationModel


class UndergroundStationRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, station_id: UUID) -> MineUndergroundStationModel | None:
        return await MineUndergroundStationModel.find_one(
            MineUndergroundStationModel.id == station_id
        )

    async def get_by_code_and_mine(
        self, station_code: str, mine_site_id: UUID
    ) -> MineUndergroundStationModel | None:
        """
        Lookup station by code, scoped to a specific mine_site_id.
        Enforces mine-level isolation of station codes.
        """
        return await MineUndergroundStationModel.find_one(
            MineUndergroundStationModel.mine_site_id == mine_site_id,
            MineUndergroundStationModel.station_code == station_code,
            MineUndergroundStationModel.is_active == True,  # noqa: E712
        )

    async def list_by_mine(
        self, mine_site_id: UUID, active_only: bool = True
    ) -> list[MineUndergroundStationModel]:
        query = MineUndergroundStationModel.find(
            MineUndergroundStationModel.mine_site_id == mine_site_id
        )
        if active_only:
            query = query.find(MineUndergroundStationModel.is_active == True)  # noqa: E712
        return await query.to_list()

    async def create(self, station: MineUndergroundStationModel) -> MineUndergroundStationModel:
        await station.insert()
        return station

    async def deactivate(self, station_id: UUID) -> MineUndergroundStationModel | None:
        station = await self.get_by_id(station_id)
        if station:
            station.is_active = False
            await station.save()
        return station
