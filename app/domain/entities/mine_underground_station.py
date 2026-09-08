"""Domain entity: MineUndergroundStation (Refinement 3)."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class MineUndergroundStation:
    id:           UUID
    mine_site_id: UUID
    station_code: str           # Unique per mine, e.g. "LEVEL3-PANEL7-VENT"
    description:  str | None
    depth_meters: float | None
    is_active:    bool
    created_at:   datetime
    updated_at:   datetime | None = None
