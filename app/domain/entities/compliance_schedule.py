"""Domain entity: ComplianceSchedule — tracks permit validity windows."""
from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID

from app.domain.enums import ComplianceStatus


@dataclass
class ComplianceSchedule:
    id:           UUID
    mine_site_id: UUID
    rule_id:      UUID
    permit_number: str
    permit_type:  str              # e.g. "EnvironmentalClearance", "MiningLease"
    issued_date:  date
    expiry_date:  date
    status:       ComplianceStatus
    renewal_url:  str | None       # S3 URL of latest permit document
    created_at:   datetime
    updated_at:   datetime | None = None
    last_alerted_days: int | None = None  # Last alert window triggered (30/15/7/1)
