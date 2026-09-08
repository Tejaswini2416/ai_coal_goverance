"""Domain entity: User."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.enums import UserRole


@dataclass
class User:
    id:            UUID
    tenant_id:     UUID
    tenant_path:   str       # Cached ltree path for fast scope checks
    email:         str
    full_name:     str
    role:          UserRole
    is_active:     bool
    hashed_password: str
    created_at:    datetime
    updated_at:    datetime | None = None
    last_login_at: datetime | None = None
