"""Mine Site Repository — Beanie/MongoDB (with GeoJSON boundary support)."""
from typing import Any
import json
from uuid import UUID

from app.infrastructure.database.models import MineSiteModel


class MineSiteRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, mine_site_id: UUID) -> MineSiteModel | None:
        return await MineSiteModel.find_one(MineSiteModel.id == mine_site_id)

    async def get_by_lease_number(self, lease_number: str) -> MineSiteModel | None:
        return await MineSiteModel.find_one(MineSiteModel.lease_number == lease_number)

    async def list_by_tenant(self, tenant_id: UUID) -> list[MineSiteModel]:
        return await MineSiteModel.find(MineSiteModel.tenant_id == tenant_id).to_list()

    async def list_active(self) -> list[MineSiteModel]:
        return await MineSiteModel.find(MineSiteModel.is_active == True).to_list()  # noqa: E712

    async def create(self, mine_site: MineSiteModel) -> MineSiteModel:
        await mine_site.insert()
        return mine_site

    async def update_boundary(self, mine_site_id: UUID, boundary_geojson: Any) -> MineSiteModel | None:
        """Update boundary stored as GeoJSON dict."""
        mine = await self.get_by_id(mine_site_id)
        if mine:
            mine.boundary = boundary_geojson
            await mine.save()
        return mine

    async def point_within_boundary(self, mine_site_id: UUID, lat: float, lon: float) -> bool:
        """
        Validate GPS point (lat, lon) against mine leasehold boundary.
        Uses MongoDB $geoIntersects with [longitude, latitude] coordinates.
        Falls back to in-memory shapely evaluation.
        """
        mine = await self.get_by_id(mine_site_id)
        if not mine or not mine.boundary:
            return False

        try:
            motor_col = MineSiteModel.get_motor_collection()
            match = await motor_col.find_one({
                "$or": [{"id": mine_site_id}, {"_id": mine_site_id}],
                "boundary": {
                    "$geoIntersects": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [lon, lat],  # [lon, lat] order
                        }
                    }
                },
            })
            if match is not None:
                return True
        except Exception:
            pass

        # In-memory / mock fallback
        try:
            from shapely.geometry import shape, Point
            polygon = shape(mine.boundary)
            point = Point(lon, lat)
            return bool(polygon.contains(point) or polygon.touches(point))
        except Exception:
            return False
