"""Underground Stations router — mine station registry CRUD."""
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime

from app.dependencies import CurrentUser, get_station_repo
from app.infrastructure.database.models import MineUndergroundStationModel
from app.infrastructure.repositories.underground_station_repository import UndergroundStationRepository

router = APIRouter(prefix="/mine-sites/{mine_site_id}/stations", tags=["Underground Stations"])


class StationCreate(BaseModel):
    station_code:  str
    description:   str | None = None
    depth_meters:  float | None = None


class StationOut(BaseModel):
    id:           UUID
    mine_site_id: UUID
    station_code: str
    description:  str | None
    depth_meters: float | None
    is_active:    bool
    created_at:   datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[StationOut])
async def list_stations(
    mine_site_id: UUID,
    active_only:  bool = True,
    user:         CurrentUser = ...,
    repo:         UndergroundStationRepository = Depends(get_station_repo),
):
    return await repo.list_by_mine(mine_site_id, active_only=active_only)


@router.post("", response_model=StationOut, status_code=201)
async def create_station(
    mine_site_id: UUID,
    body:         StationCreate,
    user:         CurrentUser,
    repo:         UndergroundStationRepository = Depends(get_station_repo),
):
    station = MineUndergroundStationModel(
        id           = uuid.uuid4(),
        mine_site_id = mine_site_id,
        station_code = body.station_code,
        description  = body.description,
        depth_meters = body.depth_meters,
        is_active    = True,
    )
    return await repo.create(station)


@router.delete("/{station_id}", status_code=204)
async def deactivate_station(
    mine_site_id: UUID,
    station_id:   UUID,
    user:         CurrentUser,
    repo:         UndergroundStationRepository = Depends(get_station_repo),
):
    result = await repo.deactivate(station_id)
    if not result:
        raise HTTPException(status_code=404, detail="Station not found.")
