"""Domain entity: ViolationCAPA."""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.domain.enums import CAPAState


@dataclass
class ViolationCAPA:
    id:                UUID
    inspection_id:     UUID
    rule_id:           UUID
    assigned_to:       UUID | None
    capa_state:        CAPAState
    description:       str
    evidence_urls:     list[str] = field(default_factory=list)  # Required at RECTIFICATION_SUBMITTED
    version:           int = 1        # Monotonic counter for optimistic locking
    idempotency_key:   UUID | None = None
    client_updated_at: datetime | None = None
    created_at:        datetime | None = None
    updated_at:        datetime | None = None
    closed_at:         datetime | None = None
    verified_by:       UUID | None = None
    verified_at:       datetime | None = None
