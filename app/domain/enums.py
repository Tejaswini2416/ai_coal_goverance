"""
Domain Enumerations
All enums used across the Coal Mines Governance system.
Pure Python — no framework imports.
"""
from enum import Enum


# ── Organizational Hierarchy ──────────────────────────────────────────────────
class TenantTier(str, Enum):
    MINISTRY   = "MINISTRY"
    SUBSIDIARY = "SUBSIDIARY"
    AREA       = "AREA"
    MINE_SITE  = "MINE_SITE"


# ── User Roles (RBAC) ─────────────────────────────────────────────────────────
class UserRole(str, Enum):
    MINISTRY_AUDITOR   = "MINISTRY_AUDITOR"
    REGULATORY_OFFICER = "REGULATORY_OFFICER"
    AREA_ADMIN         = "AREA_ADMIN"
    COLLIERY_MANAGER   = "COLLIERY_MANAGER"
    DGMS_INSPECTOR     = "DGMS_INSPECTOR"
    FIELD_WORKER       = "FIELD_WORKER"
    MINING_SIRDAR      = "MINING_SIRDAR"
    CONTRACTOR_ADMIN   = "CONTRACTOR_ADMIN"

    def can_cross_tenant(self) -> bool:
        """Ministry Auditors and Regulatory Officers may access any node in the hierarchy."""
        return self in {UserRole.MINISTRY_AUDITOR, UserRole.REGULATORY_OFFICER}

    def minimum_capa_verification_role(self) -> bool:
        """Only these roles may move CAPA to VERIFIED state."""
        return self in {
            UserRole.DGMS_INSPECTOR,
            UserRole.COLLIERY_MANAGER,
            UserRole.MINISTRY_AUDITOR,
            UserRole.REGULATORY_OFFICER,
        }


# ── CAPA State Machine ────────────────────────────────────────────────────────
class CAPAState(str, Enum):
    REPORTED                 = "REPORTED"
    NOTICE_ISSUED            = "NOTICE_ISSUED"
    ASSIGNED                 = "ASSIGNED"
    RECTIFICATION_SUBMITTED  = "RECTIFICATION_SUBMITTED"
    VERIFIED                 = "VERIFIED"
    CLOSED                   = "CLOSED"


# Allowed CAPA state transitions
CAPA_ALLOWED_TRANSITIONS: dict[CAPAState, set[CAPAState]] = {
    CAPAState.REPORTED:                {CAPAState.NOTICE_ISSUED},
    CAPAState.NOTICE_ISSUED:           {CAPAState.ASSIGNED},
    CAPAState.ASSIGNED:                {CAPAState.RECTIFICATION_SUBMITTED},
    CAPAState.RECTIFICATION_SUBMITTED: {CAPAState.VERIFIED},
    CAPAState.VERIFIED:                {CAPAState.CLOSED},
    CAPAState.CLOSED:                  set(),  # terminal
}

# Re-open privilege: any state → REPORTED (MINISTRY_AUDITOR only)
CAPA_REOPEN_ROLES = {UserRole.MINISTRY_AUDITOR}


# ── Inspection Location Type ──────────────────────────────────────────────────
class LocationType(str, Enum):
    SURFACE_GPS          = "SURFACE_GPS"
    UNDERGROUND_STATION  = "UNDERGROUND_STATION"


# ── Sync / Conflict Resolution ────────────────────────────────────────────────
class SyncStatus(str, Enum):
    CREATED   = "CREATED"
    UPDATED   = "UPDATED"
    CONFLICT  = "CONFLICT"
    DUPLICATE = "DUPLICATE"
    SKIPPED   = "SKIPPED"


class ConflictStatus(str, Enum):
    PENDING_ARBITRATION = "PENDING_ARBITRATION"
    RESOLVED_CLIENT     = "RESOLVED_CLIENT"
    RESOLVED_SERVER     = "RESOLVED_SERVER"
    AUTO_MERGED         = "AUTO_MERGED"


class SyncEntityType(str, Enum):
    INSPECTION    = "inspection"
    VIOLATION_CAPA = "violation_capa"


# ── Audit Ledger ──────────────────────────────────────────────────────────────
class AuditOperation(str, Enum):
    INSERT        = "INSERT"
    UPDATE        = "UPDATE"
    STATUS_CHANGE = "STATUS_CHANGE"
    DELETE        = "DELETE"
    TAMPER_ATTEMPT = "TAMPER_ATTEMPT"


class AuditEntityType(str, Enum):
    INSPECTION                      = "inspection"
    VIOLATION_CAPA                  = "violation_capa"
    COMPLIANCE_SCHEDULE             = "compliance_schedule"
    WAIVER                          = "waiver"
    OFFICIAL_ESCALATION             = "official_escalation"
    WORKER_LEAVE                    = "worker_leave"
    TELEMETRY_GAS                   = "telemetry_gas"
    MINE_CAST_LOG                   = "mine_cast_log"
    STATUTORY_RECORD_TAMPER_ATTEMPT = "STATUTORY_RECORD_TAMPER_ATTEMPT"
    MANAGER_MINISTRY_COMMUNICATION  = "MANAGER_MINISTRY_COMMUNICATION"


# ── Compliance / Statutory ────────────────────────────────────────────────────
class RegulatoryBody(str, Enum):
    DGMS  = "DGMS"   # Directorate General of Mines Safety
    CPCB  = "CPCB"   # Central Pollution Control Board
    SPCB  = "SPCB"   # State Pollution Control Board
    MoEF  = "MoEF"   # Ministry of Environment, Forest & Climate Change
    OTHER = "OTHER"


class ComplianceStatus(str, Enum):
    ACTIVE   = "ACTIVE"
    EXPIRING = "EXPIRING"
    EXPIRED  = "EXPIRED"
    RENEWED  = "RENEWED"
    WAIVED   = "WAIVED"


class AlertSeverity(str, Enum):
    CRITICAL = "CRITICAL"   # ≤ 1 day
    HIGH     = "HIGH"       # ≤ 7 days
    MEDIUM   = "MEDIUM"     # ≤ 15 days
    LOW      = "LOW"        # ≤ 30 days


# ── Risk Score ────────────────────────────────────────────────────────────────
class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"   # 80–100
    HIGH     = "HIGH"       # 60–79
    MEDIUM   = "MEDIUM"     # 40–59
    LOW      = "LOW"        # 0–39

    @classmethod
    def from_score(cls, score: int) -> "RiskLevel":
        if score >= 80:
            return cls.CRITICAL
        if score >= 60:
            return cls.HIGH
        if score >= 40:
            return cls.MEDIUM
        return cls.LOW


# ── Document ──────────────────────────────────────────────────────────────────
class DocumentType(str, Enum):
    INSPECTION_PHOTO   = "INSPECTION_PHOTO"
    RECTIFICATION_PHOTO = "RECTIFICATION_PHOTO"
    TEST_CERTIFICATE   = "TEST_CERTIFICATE"
    PERMIT             = "PERMIT"
    OTHER              = "OTHER"
