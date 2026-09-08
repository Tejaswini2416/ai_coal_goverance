"""
Beanie/MongoDB ODM Models
All collections for the Coal Mines AI Governance System.
"""
import hashlib
import json
import uuid
from datetime import datetime, date
from typing import List, Optional, Any, Annotated, Dict

from beanie import Document
from pymongo import IndexModel, ASCENDING
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. Tenants
# ─────────────────────────────────────────────────────────────────────────────
class TenantModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    tier: str
    path: str
    parent_path: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "tenants"
        indexes = [
            IndexModel([("path", ASCENDING)], unique=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Users
# ─────────────────────────────────────────────────────────────────────────────
class UserModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_id: uuid.UUID
    tenant_path: str
    email: str
    full_name: str
    role: str
    phone_number: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 3. User Refresh Tokens
# ─────────────────────────────────────────────────────────────────────────────
class UserRefreshTokenModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    token_hash: str
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_refresh_tokens"
        indexes = [
            IndexModel([("token_hash", ASCENDING)], unique=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 4. Mine Sites
# ─────────────────────────────────────────────────────────────────────────────
class MineSiteModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_id: uuid.UUID
    name: str
    lease_number: str
    boundary: Optional[Any] = None  # Stored as GeoJSON Polygon/MultiPolygon dict
    district: str
    state: str
    pin_code: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "mine_sites"
        indexes = [
            IndexModel([("lease_number", ASCENDING)], unique=True),
            IndexModel([("boundary", "2dsphere")], sparse=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 5. Mine Underground Stations
# ─────────────────────────────────────────────────────────────────────────────
class MineUndergroundStationModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    station_code: str
    description: Optional[str] = None
    depth_meters: Optional[float] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "mine_underground_stations"
        indexes = [
            IndexModel([("mine_site_id", ASCENDING), ("station_code", ASCENDING)], unique=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 6. Inspections
# ─────────────────────────────────────────────────────────────────────────────
class InspectionModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    inspector_id: uuid.UUID
    title: str
    description: str
    location_type: str = "SURFACE_GPS"
    gps_location: Optional[Any] = None
    station_id: Optional[str] = None
    is_geofence_breached: bool = False
    version: int = 1
    idempotency_key: uuid.UUID = Field(default_factory=uuid.uuid4)
    last_idempotency_key: Optional[uuid.UUID] = None
    client_updated_at: Optional[datetime] = None
    risk_score: Optional[int] = None
    inspection_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "inspections"
        indexes = [
            IndexModel([("idempotency_key", ASCENDING)], unique=True),
            IndexModel([("mine_site_id", ASCENDING), ("inspection_date", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 7. Statutory Rules
# ─────────────────────────────────────────────────────────────────────────────
class StatutoryRuleModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    rule_code: str
    title: str
    regulatory_body: str
    category: str
    description: str
    is_active: bool = True
    effective_from: date
    effective_until: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "statutory_rules"
        indexes = [
            IndexModel([("rule_code", ASCENDING)], unique=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 8. Violation CAPAs
# ─────────────────────────────────────────────────────────────────────────────
class ViolationCAPAModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    inspection_id: uuid.UUID
    rule_id: uuid.UUID
    assigned_to: Optional[uuid.UUID] = None
    capa_state: str = "REPORTED"
    description: str
    evidence_urls: List[str] = Field(default_factory=list)
    version: int = 1
    idempotency_key: Optional[uuid.UUID] = None
    last_idempotency_key: Optional[uuid.UUID] = None
    client_updated_at: Optional[datetime] = None
    verified_by: Optional[uuid.UUID] = None
    verified_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "violation_capas"
        indexes = [
            IndexModel([("idempotency_key", ASCENDING)], unique=True, sparse=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 9. Compliance Schedules
# ─────────────────────────────────────────────────────────────────────────────
class ComplianceScheduleModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    rule_id: uuid.UUID
    permit_number: str
    permit_type: str
    issued_date: date
    expiry_date: date
    status: str = "ACTIVE"
    renewal_url: Optional[str] = None
    last_alerted_days: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "compliance_schedules"
        indexes = [
            IndexModel([("permit_number", ASCENDING)], unique=True),
            IndexModel([("expiry_date", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 10. Compliance Alerts
# ─────────────────────────────────────────────────────────────────────────────
class ComplianceAlertModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    schedule_id: uuid.UUID
    severity: str
    days_until_expiry: int
    is_acknowledged: bool = False
    acknowledged_by: Optional[uuid.UUID] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "compliance_alerts"


# ─────────────────────────────────────────────────────────────────────────────
# 11. Audit Ledger & Cryptographic Provenance
# ─────────────────────────────────────────────────────────────────────────────
def compute_block_hash(previous_hash: str, sequence_number: int, actor_id: str, payload: dict) -> str:
    """
    Deterministic canonical SHA-256 hash for statutory audit blocks.
    Enforces sorted keys and compact separators to guarantee identical hash calculation.
    """
    canonical_payload = json.dumps(payload or {}, sort_keys=True, separators=(',', ':'), default=str)
    raw_bytes = f"{previous_hash}|{sequence_number}|{actor_id}|{canonical_payload}".encode("utf-8")
    return hashlib.sha256(raw_bytes).hexdigest()


class AuditLedgerModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    sequence_number: int = 1
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    mine_site_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_name: Optional[str] = "Godavarikhani No. 11A Incline (SCCL)"
    actor_id: Optional[str] = None
    created_by: uuid.UUID = Field(default_factory=uuid.uuid4)
    actor_role: Optional[str] = "COLLIERY_MANAGER"
    action_type: Optional[str] = "INSPECTION_SUBMITTED"
    entity_type: Optional[str] = "inspection"
    entity_id: Optional[uuid.UUID] = None
    operation: Optional[str] = "INSERT"
    payload: Dict[str, Any] = Field(default_factory=dict)
    payload_json: Any = None
    previous_hash: str = "GENESIS_BLOCK"
    prev_hash: Optional[str] = None
    current_hash: str = ""
    record_hash: Optional[str] = None

    class Settings:
        name = "audit_ledger"
        indexes = [
            IndexModel([("mine_site_id", ASCENDING), ("sequence_number", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 12. Sync Conflict Log
# ─────────────────────────────────────────────────────────────────────────────
class SyncConflictLogModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    idempotency_key: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    client_version: int
    server_version: int
    client_payload: Any
    server_snapshot: Any
    diff_json: Any
    status: str = "PENDING_ARBITRATION"
    arbitrated_by: Optional[uuid.UUID] = None
    arbitrated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sync_conflict_log"
        indexes = [
            IndexModel([("idempotency_key", ASCENDING)], unique=True),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 13. Worker Attendance
# ─────────────────────────────────────────────────────────────────────────────
class WorkerAttendanceModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    worker_id: str
    worker_name: str
    mine_site_id: uuid.UUID
    zone_type: str = "UNDERGROUND"  # UNDERGROUND, SURFACE_PIT, HAUL_ROAD, CHPP
    station_id: Optional[str] = None
    shift: str = "MORNING"  # MORNING, EVENING, NIGHT
    check_in_time: datetime = Field(default_factory=datetime.utcnow)
    check_out_time: Optional[datetime] = None
    biometric_verified: bool = True
    gas_level_exposure_ppm: Optional[float] = None
    status: str = "ACTIVE_INSIDE"  # ACTIVE_INSIDE, CHECKED_OUT, EMERGENCY_EVACUATED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "worker_attendance"
        indexes = [
            IndexModel([("mine_site_id", ASCENDING), ("check_in_time", ASCENDING)]),
            IndexModel([("worker_id", ASCENDING), ("status", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 14. Inspection Schedules & Assignments
# ─────────────────────────────────────────────────────────────────────────────
class InspectionScheduleModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    assigned_inspector_id: uuid.UUID
    inspector_name: str
    inspection_title: str
    inspection_type: str = "SAFETY_AUDIT"  # SAFETY_AUDIT, VENTILATION_CHECK, HAUL_ROAD_AUDIT, STATUTORY_PERMIT
    scheduled_date: date
    due_date: date
    status: str = "ASSIGNED"  # SCHEDULED, ASSIGNED, IN_PROGRESS, COMPLETED, OVERDUE
    priority: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    completed_inspection_id: Optional[uuid.UUID] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "inspection_schedules"
        indexes = [
            IndexModel([("mine_site_id", ASCENDING), ("due_date", ASCENDING)]),
            IndexModel([("assigned_inspector_id", ASCENDING), ("status", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 15. Notifications & Alert Acknowledgments
# ─────────────────────────────────────────────────────────────────────────────
class NotificationModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    recipient_user_id: Optional[uuid.UUID] = None
    recipient_role: Optional[str] = None  # DGMS_INSPECTOR, COLLIERY_MANAGER, MINISTRY_AUDITOR, CONTRACTOR_ADMIN, FIELD_WORKER
    mine_site_id: uuid.UUID
    title: str
    message: str
    category: str = "GENERAL"  # GEOFENCE_BREACH, CAPA_NOTICE, PERMIT_EXPIRING, INSPECTION_OVERDUE, ATTENDANCE_HAZARD
    severity: str = "URGENT"  # INFO, WARNING, URGENT, CRITICAL
    channel: str = "IN_APP"  # IN_APP, EMAIL, SMS_PUSH
    is_read: bool = False
    is_acknowledged: bool = False
    acknowledged_by: Optional[uuid.UUID] = None
    acknowledged_by_name: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    acknowledgement_note: Optional[str] = None
    escalation_level: int = 0  # 0: Direct, 1: Manager, 2: Ministry/Higher Authority
    escalated_to_role: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
        indexes = [
            IndexModel([("recipient_user_id", ASCENDING), ("is_read", ASCENDING)]),
            IndexModel([("mine_site_id", ASCENDING), ("is_acknowledged", ASCENDING)]),
            IndexModel([("severity", ASCENDING), ("escalation_level", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 16. Worker Statutory Leave Applications
# ─────────────────────────────────────────────────────────────────────────────
class WorkerLeaveModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    worker_id: str
    worker_name: str
    mine_site_id: uuid.UUID
    leave_type: str = "CASUAL"  # CASUAL, SICK_MEDICAL, EARNED_STATUTORY, COMPENSATORY
    start_date: date
    end_date: date
    total_days: int = 1
    reason: str
    relief_worker_id: Optional[str] = None
    relief_worker_name: Optional[str] = None
    status: str = "SUBMITTED"  # SUBMITTED, APPROVED, REJECTED, CANCELLED
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "worker_leaves"
        indexes = [
            IndexModel([("worker_id", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("mine_site_id", ASCENDING), ("created_at", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 17. Atmospheric Gas Telemetry
# ─────────────────────────────────────────────────────────────────────────────
class TelemetryGasModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    station_id: str
    station_code: str
    location_name: str = "Return Airway Gallery #4"
    ch4_percentage: float = 0.28
    co_ppm: float = 8.5
    o2_percentage: float = 20.8
    air_velocity_ms: float = 2.1
    temperature_celsius: float = 28.4
    barometric_pressure_hpa: float = 1012.0
    status: str = "COMMITTED"  # COMMITTED, APPROVED, EXCURSION_WARNING, STATUTORY_BREACH
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    record_hash: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "telemetry_gas"
        indexes = [
            IndexModel([("mine_site_id", ASCENDING), ("recorded_at", ASCENDING)]),
            IndexModel([("station_code", ASCENDING)]),
        ]


# ─────────────────────────────────────────────────────────────────────────────
# 18. Mine Casts & Extraction Logs
# ─────────────────────────────────────────────────────────────────────────────
class MineCastExtractionModel(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    mine_site_id: uuid.UUID
    bench_id: str
    bench_name: str
    shift: str = "MORNING"  # MORNING, EVENING, NIGHT
    cast_date: date = Field(default_factory=date.today)
    extraction_tonnage: float = 1450.0
    target_quota_tonnage: float = 1500.0
    dumper_trips_count: int = 48
    blasting_clearance_status: str = "CLEARED"  # CLEARED, RESTRICTED, HOLD
    explosives_used_kg: float = 320.0
    clearance_engineer_name: str = "Er. K. Venkat Rao (Blasting In-Charge)"
    status: str = "COMMITTED"  # COMMITTED, APPROVED
    record_hash: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "mine_cast_extractions"
        indexes = [
            IndexModel([("mine_site_id", ASCENDING), ("cast_date", ASCENDING)]),
            IndexModel([("bench_id", ASCENDING)]),
        ]


# Array of all models to pass to init_beanie
document_models = [
    TenantModel,
    UserModel,
    UserRefreshTokenModel,
    MineSiteModel,
    MineUndergroundStationModel,
    InspectionModel,
    StatutoryRuleModel,
    ViolationCAPAModel,
    ComplianceScheduleModel,
    ComplianceAlertModel,
    AuditLedgerModel,
    SyncConflictLogModel,
    WorkerAttendanceModel,
    InspectionScheduleModel,
    NotificationModel,
    WorkerLeaveModel,
    TelemetryGasModel,
    MineCastExtractionModel,
]


