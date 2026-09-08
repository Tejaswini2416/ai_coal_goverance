"""
FastAPI Dependency Injection — shared dependencies (MongoDB/Beanie version).
"""
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request

from app.infrastructure.cache.redis_client import get_redis
from app.infrastructure.database.models import UserModel
from app.infrastructure.repositories.attendance_repository import AttendanceRepository
from app.infrastructure.repositories.audit_ledger_repository import AuditLedgerRepository
from app.infrastructure.repositories.capa_repository import CAPARepository
from app.infrastructure.repositories.compliance_repository import ComplianceRepository
from app.infrastructure.repositories.inspection_repository import InspectionRepository
from app.infrastructure.repositories.mine_site_repository import MineSiteRepository
from app.infrastructure.repositories.notification_repository import NotificationRepository
from app.infrastructure.repositories.schedule_repository import ScheduleRepository
from app.infrastructure.repositories.sync_conflict_repository import SyncConflictRepository
from app.infrastructure.repositories.tenant_repository import TenantRepository
from app.infrastructure.repositories.underground_station_repository import UndergroundStationRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.services.capa_service import CAPAService
from app.services.document_service import DocumentService
from app.services.geofence_service import GeofenceService
from app.services.notification_service import NotificationService
from app.services.schedule_service import ScheduleService
from app.services.sync_service import SyncService
from app.services.tenant_service import TenantService


# ── Current User (from request.state set by TenantScopeMiddleware) ─────────────
def get_current_user_state(request: Request) -> dict:
    if not hasattr(request.state, "user_id"):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {
        "user_id":     request.state.user_id,
        "email":       request.state.email,
        "role":        request.state.role,
        "tenant_id":   request.state.tenant_id,
        "tenant_path": request.state.tenant_path,
    }


CurrentUser = Annotated[dict, Depends(get_current_user_state)]


# ── RBAC Guard ────────────────────────────────────────────────────────────────
def require_roles(*roles: str):
    """Factory returning a FastAPI dependency that checks user role."""
    def _check(user: CurrentUser):
        if user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{user['role']}' not authorized. Required: {list(roles)}.",
            )
        return user
    return Depends(_check)


# ── Repository Factories ──────────────────────────────────────────────────────
# With Beanie, repositories are stateless (no session needed). We use Depends
# to keep the interface consistent and support future extension.

def get_tenant_repo() -> TenantRepository:
    return TenantRepository()

def get_user_repo() -> UserRepository:
    return UserRepository()

def get_mine_site_repo() -> MineSiteRepository:
    return MineSiteRepository()

def get_inspection_repo() -> InspectionRepository:
    return InspectionRepository()

def get_capa_repo() -> CAPARepository:
    return CAPARepository()

def get_audit_repo() -> AuditLedgerRepository:
    return AuditLedgerRepository()

def get_compliance_repo() -> ComplianceRepository:
    return ComplianceRepository()

def get_station_repo() -> UndergroundStationRepository:
    return UndergroundStationRepository()

def get_conflict_repo() -> SyncConflictRepository:
    return SyncConflictRepository()

def get_attendance_repo() -> AttendanceRepository:
    return AttendanceRepository()

def get_schedule_repo() -> ScheduleRepository:
    return ScheduleRepository()

def get_notif_repo() -> NotificationRepository:
    return NotificationRepository()


# ── Service Factories ─────────────────────────────────────────────────────────
def get_audit_service(audit_repo: AuditLedgerRepository = Depends(get_audit_repo)) -> AuditService:
    return AuditService(audit_repo)

def get_geofence_service(
    mine_repo: MineSiteRepository              = Depends(get_mine_site_repo),
    station_repo: UndergroundStationRepository = Depends(get_station_repo),
) -> GeofenceService:
    return GeofenceService(mine_repo, station_repo)

def get_capa_service(
    capa_repo:  CAPARepository = Depends(get_capa_repo),
    audit_svc:  AuditService   = Depends(get_audit_service),
) -> CAPAService:
    return CAPAService(capa_repo, audit_svc)

def get_sync_service(
    inspection_repo: InspectionRepository    = Depends(get_inspection_repo),
    capa_repo:       CAPARepository          = Depends(get_capa_repo),
    conflict_repo:   SyncConflictRepository  = Depends(get_conflict_repo),
    geofence_svc:    GeofenceService         = Depends(get_geofence_service),
    audit_svc:       AuditService            = Depends(get_audit_service),
) -> SyncService:
    return SyncService(inspection_repo, capa_repo, conflict_repo, geofence_svc, audit_svc)

def get_tenant_service(tenant_repo: TenantRepository = Depends(get_tenant_repo)) -> TenantService:
    return TenantService(tenant_repo)

def get_document_service() -> DocumentService:
    return DocumentService()

def get_notification_service(
    notif_repo: NotificationRepository = Depends(get_notif_repo)
) -> NotificationService:
    return NotificationService(notif_repo)

def get_schedule_service(
    schedule_repo: ScheduleRepository    = Depends(get_schedule_repo),
    notif_repo:    NotificationRepository = Depends(get_notif_repo),
) -> ScheduleService:
    return ScheduleService(schedule_repo, notif_repo)
