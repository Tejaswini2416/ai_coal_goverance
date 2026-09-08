"""Domain entity: StatutoryRule."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.enums import RegulatoryBody


@dataclass
class StatutoryRule:
    id:              UUID
    rule_code:       str              # e.g. "DGMS-2024-SEC42"
    title:           str
    regulatory_body: RegulatoryBody
    category:        str              # e.g. "VentilationSafety", "ExplosivesHandling"
    description:     str
    is_active:       bool
    effective_from:  datetime
    effective_until: datetime | None
    created_at:      datetime
    updated_at:      datetime | None = None
