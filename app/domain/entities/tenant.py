"""Domain entity: Tenant (Organizational node in the 4-tier hierarchy)."""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.domain.enums import TenantTier


@dataclass
class Tenant:
    id:         UUID
    name:       str
    tier:       TenantTier
    path:       str           # ltree path, e.g. "MOC.SECL.KORBA.PIT1"
    parent_id:  UUID | None
    created_at: datetime
    updated_at: datetime | None = None

    def is_ancestor_of(self, other_path: str) -> bool:
        """True if this tenant is an ancestor of the given ltree path."""
        return other_path.startswith(self.path + ".") or other_path == self.path

    def label(self) -> str:
        """Return the final segment of the ltree path (this node's label)."""
        return self.path.rsplit(".", 1)[-1]
