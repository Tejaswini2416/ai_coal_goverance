"""
Integration tests — MongoDB Geospatial and Materialized Path queries.
Tests: GeoJSON boundary validation ($geoIntersects/shapely), point inside/outside,
underground station validation, and Materialized Path tenant hierarchy regex queries.
"""
import uuid
import pytest
from fastapi import HTTPException

from app.domain.enums import LocationType
from app.infrastructure.database.models import TenantModel
from app.infrastructure.repositories.mine_site_repository import MineSiteRepository
from app.infrastructure.repositories.tenant_repository import TenantRepository
from app.infrastructure.repositories.underground_station_repository import UndergroundStationRepository
from app.services.geofence_service import GeofenceService


@pytest.mark.asyncio
async def test_point_inside_boundary(mine_site_with_boundary):
    """Point at (82.5, 21.5) is inside Polygon boundary."""
    mine_repo = MineSiteRepository()
    station_repo = UndergroundStationRepository()
    svc = GeofenceService(mine_repo, station_repo)

    breached, msg = await svc.validate(
        mine_site_id=mine_site_with_boundary.id,
        location_type=LocationType.SURFACE_GPS,
        gps_location="POINT(82.5 21.5)",
        station_id=None,
    )
    assert breached is False
    assert msg is None


@pytest.mark.asyncio
async def test_point_outside_boundary(mine_site_with_boundary):
    """Point at (99.0, 10.0) is outside the mine boundary polygon."""
    mine_repo = MineSiteRepository()
    station_repo = UndergroundStationRepository()
    svc = GeofenceService(mine_repo, station_repo)

    breached, msg = await svc.validate(
        mine_site_id=mine_site_with_boundary.id,
        location_type=LocationType.SURFACE_GPS,
        gps_location="POINT(99.0 10.0)",
        station_id=None,
    )
    assert breached is True
    assert msg is not None


@pytest.mark.asyncio
async def test_underground_station_valid(mine_site, underground_station):
    """Valid station_code for correct mine → not breached, no GPS needed."""
    mine_repo = MineSiteRepository()
    station_repo = UndergroundStationRepository()
    svc = GeofenceService(mine_repo, station_repo)

    breached, msg = await svc.validate(
        mine_site_id=mine_site.id,
        location_type=LocationType.UNDERGROUND_STATION,
        gps_location=None,
        station_id=underground_station.station_code,
    )
    assert breached is False


@pytest.mark.asyncio
async def test_underground_station_wrong_mine(mine_site, underground_station):
    """Station from one mine queried against a different mine → 422."""
    mine_repo = MineSiteRepository()
    station_repo = UndergroundStationRepository()
    svc = GeofenceService(mine_repo, station_repo)

    with pytest.raises(HTTPException) as exc_info:
        await svc.validate(
            mine_site_id=uuid.uuid4(),  # different mine
            location_type=LocationType.UNDERGROUND_STATION,
            gps_location=None,
            station_id=underground_station.station_code,
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_materialized_path_subtree_query(ministry_tenant):
    """Materialized path regex prefix returns subtree correctly."""
    repo = TenantRepository()

    # Create SECL subsidiary
    secl = TenantModel(
        id=uuid.uuid4(),
        name="SECL",
        tier="SUBSIDIARY",
        path="MOC.SECL",
        parent_path="MOC",
        parent_id=ministry_tenant.id,
    )
    await secl.insert()

    # Create KORBA area
    korba = TenantModel(
        id=uuid.uuid4(),
        name="Korba Area",
        tier="AREA",
        path="MOC.SECL.KORBA",
        parent_path="MOC.SECL",
        parent_id=secl.id,
    )
    await korba.insert()

    # Subtree of SECL should return SECL + KORBA (not MOC)
    subtree = await repo.get_subtree("MOC.SECL")
    paths = [t.path for t in subtree]
    assert "MOC.SECL" in paths
    assert "MOC.SECL.KORBA" in paths
    assert "MOC" not in paths  # ancestor, not descendant
