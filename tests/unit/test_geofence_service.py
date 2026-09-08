"""
Unit tests — Geofence Service (Refinement 3).
Tests: SURFACE_GPS breach, inside boundary, UNDERGROUND_STATION valid/invalid,
       missing station_id, missing gps_location, wrong mine station lookup.
"""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.domain.enums import LocationType
from app.services.geofence_service import GeofenceService


def _make_service(mine_repo=None, station_repo=None):
    mine_repo    = mine_repo    or MagicMock()
    station_repo = station_repo or MagicMock()
    return GeofenceService(mine_repo, station_repo)


# ── SURFACE_GPS Tests ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_surface_gps_inside_boundary_not_breached():
    mine_id = uuid.uuid4()
    mine    = MagicMock()
    mine.id       = mine_id
    mine.boundary = "MULTIPOLYGON(...)"   # truthy

    mine_repo = MagicMock()
    mine_repo.get_by_id               = AsyncMock(return_value=mine)
    mine_repo.point_within_boundary   = AsyncMock(return_value=True)   # inside

    svc = _make_service(mine_repo=mine_repo)
    breached, msg = await svc.validate(
        mine_site_id  = mine_id,
        location_type = LocationType.SURFACE_GPS,
        gps_location  = "POINT(82.5 21.5)",
        station_id    = None,
    )
    assert breached is False
    assert msg is None


@pytest.mark.asyncio
async def test_surface_gps_outside_boundary_breached():
    mine_id = uuid.uuid4()
    mine    = MagicMock()
    mine.id       = mine_id
    mine.boundary = "MULTIPOLYGON(...)"

    mine_repo = MagicMock()
    mine_repo.get_by_id             = AsyncMock(return_value=mine)
    mine_repo.point_within_boundary = AsyncMock(return_value=False)   # outside

    svc = _make_service(mine_repo=mine_repo)
    breached, msg = await svc.validate(
        mine_site_id  = mine_id,
        location_type = LocationType.SURFACE_GPS,
        gps_location  = "POINT(99.0 10.0)",
        station_id    = None,
    )
    assert breached is True
    assert "OUTSIDE" in msg


@pytest.mark.asyncio
async def test_surface_gps_without_coords_raises_422():
    svc = _make_service()
    with pytest.raises(HTTPException) as exc_info:
        await svc.validate(
            mine_site_id  = uuid.uuid4(),
            location_type = LocationType.SURFACE_GPS,
            gps_location  = None,      # ← missing!
            station_id    = None,
        )
    assert exc_info.value.status_code == 422


# ── UNDERGROUND_STATION Tests ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_underground_valid_station_not_breached():
    mine_id     = uuid.uuid4()
    station     = MagicMock()
    station.station_code = "LEVEL3-PANEL7"

    station_repo = MagicMock()
    station_repo.get_by_code_and_mine = AsyncMock(return_value=station)

    svc = _make_service(station_repo=station_repo)
    breached, msg = await svc.validate(
        mine_site_id  = mine_id,
        location_type = LocationType.UNDERGROUND_STATION,
        gps_location  = None,
        station_id    = "LEVEL3-PANEL7",
    )
    assert breached is False
    assert msg is None


@pytest.mark.asyncio
async def test_underground_unknown_station_raises_422():
    station_repo = MagicMock()
    station_repo.get_by_code_and_mine = AsyncMock(return_value=None)   # not found

    svc = _make_service(station_repo=station_repo)
    with pytest.raises(HTTPException) as exc_info:
        await svc.validate(
            mine_site_id  = uuid.uuid4(),
            location_type = LocationType.UNDERGROUND_STATION,
            gps_location  = None,
            station_id    = "UNKNOWN-STATION",
        )
    assert exc_info.value.status_code == 422
    assert "not registered" in exc_info.value.detail


@pytest.mark.asyncio
async def test_underground_without_station_id_raises_422():
    svc = _make_service()
    with pytest.raises(HTTPException) as exc_info:
        await svc.validate(
            mine_site_id  = uuid.uuid4(),
            location_type = LocationType.UNDERGROUND_STATION,
            gps_location  = None,
            station_id    = None,   # ← missing!
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_station_from_different_mine_raises_422():
    """Station lookup is mine-scoped — station from another mine must not match."""
    station_repo = MagicMock()
    # Simulate: lookup with mine_site_id=A returns None (station belongs to mine B)
    station_repo.get_by_code_and_mine = AsyncMock(return_value=None)

    svc = _make_service(station_repo=station_repo)
    with pytest.raises(HTTPException) as exc_info:
        await svc.validate(
            mine_site_id  = uuid.uuid4(),   # mine A
            location_type = LocationType.UNDERGROUND_STATION,
            gps_location  = None,
            station_id    = "LEVEL3-PANEL7",  # belongs to mine B
        )
    assert exc_info.value.status_code == 422
