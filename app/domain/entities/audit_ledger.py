"""Domain entity: AuditLedger — per-mine-site sharded hash-chained entry."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.enums import AuditOperation, AuditEntityType


@dataclass
class AuditLedger:
    id:              UUID
    mine_site_id:    UUID
    sequence_number: int
    entity_type:     AuditEntityType
    entity_id:       UUID
    operation:       AuditOperation
    payload_json:    dict             # Deterministic sorted-key JSON snapshot
    prev_hash:       str              # SHA-256 of previous entry; "GENESIS" for seq=1
    record_hash:     str              # SHA-256(mine_site_id+seq+prev_hash+payload_json)
    created_by:      UUID
    created_at:      datetime
