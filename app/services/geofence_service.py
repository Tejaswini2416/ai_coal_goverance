"""
Geofence Validation Service — Refinement 3.
Supports dual-mode location: SURFACE_GPS (PostGIS ST_Contains) and
UNDERGROUND_STATION (station registry lookup scoped by mine_site_id).
"""
from uuid import UUID

from fastapi import HTTPException

from app.domain.enums import LocationType
from app.infrastructure.repositories.mine_site_repository import MineSiteRepository
from app.infrastructure.repositories.underground_station_repository import UndergroundStationRepository


class GeofenceService:
    def __init__(
        self,
        mine_site_repo: MineSiteRepository,
        station_repo:   UndergroundStationRepository,
    ) -> None:
        self._mine_repo    = mine_site_repo
        self._station_repo = station_repo

    async def validate(
        self,
        mine_site_id:  UUID,
        location_type: LocationType,
        gps_location:  str | None,    # WKT POINT string, e.g. "POINT(84.123 22.456)"
        station_id:    str | None,    # station_code string
    ) -> tuple[bool, str | None]:
        """
        Returns (is_geofence_breached: bool, alert_message: str | None).

        SURFACE_GPS:
            - Runs ST_Contains(mine_boundary, inspection_point) at DB level.
            - Returns True (breached) if point is outside mine boundary.

        UNDERGROUND_STATION:
            - Validates station_code exists in mine_underground_stations
              for THIS SPECIFIC mine_site_id (mine-scoped, not global).
            - No GPS check performed.
            - Returns False (not breached) on valid station.
            - Raises HTTP 422 on unknown or inactive station.
        """
        if location_type == LocationType.UNDERGROUND_STATION:
            return await self._validate_underground(mine_site_id, station_id)

        return await self._validate_surface_gps(mine_site_id, gps_location)

    async def _validate_underground(
        self, mine_site_id: UUID, station_id: str | None
    ) -> tuple[bool, str | None]:
        if not station_id:
            raise HTTPException(
                status_code=422,
                detail="station_id is required when location_type is UNDERGROUND_STATION.",
            )

        # Lookup scoped to this mine's station registry (Refinement 3)
        station = await self._station_repo.get_by_code_and_mine(
            station_code=station_id,
            mine_site_id=mine_site_id,
        )
        if not station:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Station '{station_id}' is not registered or is inactive "
                    f"for mine site '{mine_site_id}'. "
                    "Ensure the station exists in the mine_underground_stations registry."
                ),
            )
        # Underground station validated — no geofence breach concept applies
        return False, None

    async def _validate_surface_gps(
        self, mine_site_id: UUID, gps_location: str | None
    ) -> tuple[bool, str | None]:
        if not gps_location:
            raise HTTPException(
                status_code=422,
                detail="gps_location (WKT POINT) is required when location_type is SURFACE_GPS.",
            )

        mine_site = await self._mine_repo.get_by_id(mine_site_id)
        if not mine_site:
            raise HTTPException(status_code=404, detail=f"Mine site '{mine_site_id}' not found.")

        if mine_site.boundary is None:
            # No boundary defined — cannot validate, flag as breached for safety
            return True, "Mine site has no boundary defined; geofence validation skipped but flagged."

        # Parse WKT "POINT(lon lat)" into lat/lon floats for shapely check
        try:
            coords = gps_location.replace("POINT(", "").replace(")", "").strip().split()
            lon, lat = float(coords[0]), float(coords[1])
        except Exception:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid gps_location format. Expected 'POINT(lon lat)', got: '{gps_location}'"
            )

        is_inside = await self._mine_repo.point_within_boundary(mine_site_id, lat, lon)

        if not is_inside:
            return True, (
                f"GPS coordinates ({gps_location}) are OUTSIDE the designated mine lease boundary "
                f"for mine site '{mine_site_id}'. Submission flagged as IS_GEOFENCE_BREACHED."
            )

        return False, None
