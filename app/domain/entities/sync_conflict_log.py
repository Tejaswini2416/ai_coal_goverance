"""Domain entity: SyncConflictLog — tracks optimistic version conflicts (Refinement 4)."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.enums import ConflictStatus, SyncEntityType


@dataclass
class SyncConflictLog:
    id:              UUID
    idempotency_key: UUID
    entity_type:     SyncEntityType
    entity_id:       UUID
    client_version:  int
    server_version:  int
    client_payload:  dict          # What the client submitted
    server_snapshot: dict          # Server state at conflict time
    diff_json:       dict          # Field-level diff {field: [client_val, server_val]}
    status:          ConflictStatus
    arbitrated_by:   UUID | None
    arbitrated_at:   datetime | None
    created_at:      datetime
