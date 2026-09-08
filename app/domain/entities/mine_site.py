"""Domain entity: MineSite."""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class MineSite:
    id:            UUID
    tenant_id:     UUID          # Must be MINE_SITE tier tenant
    name:          str
    lease_number:  str
    boundary_wkt:  str | None    # WKT of MULTIPOLYGON boundary (PostGIS)
    district:      str
    state:         str
    pin_code:      str | None
    is_active:     bool
    created_at:    datetime
    updated_at:    datetime | None = None
