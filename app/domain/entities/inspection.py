"""Domain entity: Inspection."""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.domain.enums import LocationType


@dataclass
class Inspection:
    id:                   UUID
    mine_site_id:         UUID
    inspector_id:         UUID
    title:                str
    description:          str
    location_type:        LocationType
    gps_location_wkt:     str | None          # WKT POINT — only for SURFACE_GPS
    station_id:           str | None          # Station code — only for UNDERGROUND_STATION
    is_geofence_breached: bool
    inspection_date:      datetime
    version:              int                  # Monotonic counter for optimistic locking
    idempotency_key:      UUID
    client_updated_at:    datetime | None      # Client timestamp — for display only
    created_at:           datetime
    updated_at:           datetime | None = None
    risk_score:           int | None = None   # Populated by risk_scorer worker
