"""
Audit Ledger router — cryptographic provenance viewing, real-time integrity verification, and tamper simulation.
"""
from uuid import UUID
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from datetime import datetime

from app.dependencies import CurrentUser, get_audit_service
from app.services.audit_service import AuditService, AuditIntegrityResult

router = APIRouter(prefix="/audit-ledger", tags=["Audit Ledger"])


class LedgerEntryOut(BaseModel):
    id: UUID
    mine_site_id: UUID
    sequence_number: int
    entity_type: str
    entity_id: UUID
    operation: str
    prev_hash: str
    record_hash: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class SimulateTamperRequest(BaseModel):
    mine_site_id: str = Field(..., description="Target Mine Site UUID")
    sequence_number: int = Field(default=1, description="Audit sequence block to tamper with")
    tampered_field: str = Field(default="ch4_reading", description="Field to falsify in payload")
    new_value: Any = Field(default="0.02%", description="Falsified value to inject into MongoDB")


@router.get("/verify", response_model=AuditIntegrityResult)
async def verify_ledger_integrity_endpoint(
    mine_site_id: Optional[str] = Query(None, description="Optional mine site ID to verify hash chain for"),
    user: Optional[CurrentUser] = None,
    audit_svc: AuditService = Depends(get_audit_service),
):
    """
    Scans the append-only cryptographic SHA-256 hash chain.
    Recomputes every block hash and returns whether the chain is intact.
    If database records were modified or deleted, returns exact tamper diagnosis.
    """
    return await audit_svc.verify_ledger_integrity(mine_site_id)


@router.post("/simulate-tamper")
async def simulate_tamper_endpoint(
    body: SimulateTamperRequest,
    user: Optional[CurrentUser] = None,
    audit_svc: AuditService = Depends(get_audit_service),
):
    """
    Live Demonstration Endpoint:
    Directly alters a payload in MongoDB without updating its cryptographic hash
    to demonstrate immediate tamper detection to the jury and regulatory inspectors.
    """
    return await audit_svc.simulate_tamper(
        mine_site_id=body.mine_site_id,
        sequence_number=body.sequence_number,
        tampered_field=body.tampered_field,
        new_value=body.new_value,
    )


class AttemptTamperRequest(BaseModel):
    mine_site_id: str = Field(..., description="Target Mine Site UUID")
    target_model: str = Field(default="TelemetryGasModel", description="Target model e.g. TelemetryGasModel, InspectionModel")
    entity_id: Optional[str] = Field(default=None, description="Record UUID")
    target_field: str = Field(default="co_ppm", description="Target field being altered")
    old_value: Any = Field(default="68.0 ppm", description="Original approved value")
    new_value: Any = Field(default="18.0 ppm", description="Falsified value")
    manager_name: Optional[str] = Field(default="N. Ramesh", description="Manager name")


@router.post("/attempt-tamper-mutation")
async def attempt_tamper_mutation_endpoint(
    body: AttemptTamperRequest,
    user: Optional[CurrentUser] = None,
    audit_svc: AuditService = Depends(get_audit_service),
):
    """
    Statutory Interceptor Endpoint:
    Simulates or handles an unauthorized attempt by a Colliery Manager to alter an approved/committed record.
    1. Intercepts mutation and rejects with UNAUTHORIZED_MODIFICATION_ATTEMPT.
    2. Logs block to AuditLedgerModel with action STATUTORY_RECORD_TAMPER_ATTEMPT.
    3. Emits CRITICAL notifications to DGMS_INSPECTOR and MINISTRY_AUDITOR.
    """
    import uuid
    from fastapi import HTTPException, status
    
    try:
        mine_uuid = UUID(body.mine_site_id)
    except Exception:
        mine_uuid = UUID("11111111-1111-4111-a111-111111111111")
        
    try:
        entity_uuid = UUID(body.entity_id) if body.entity_id else uuid.uuid4()
    except Exception:
        entity_uuid = uuid.uuid4()

    caller_id = UUID(user["user_id"]) if user and "user_id" in user else uuid.uuid4()
    caller_role = user.get("role", "COLLIERY_MANAGER") if user else "COLLIERY_MANAGER"
    caller_name = body.manager_name or (user.get("full_name") if user else "N. Ramesh (Manager - GDK 11A)")

    incident = await audit_svc.intercept_tamper_attempt(
        mine_site_id=mine_uuid,
        actor_id=caller_id,
        actor_name=caller_name,
        actor_role=caller_role,
        colliery_name="Godavarikhani No. 11A Incline (GDK-11A)",
        target_model=body.target_model,
        entity_id=entity_uuid,
        target_field=body.target_field,
        old_value=body.old_value,
        new_value=body.new_value,
        stored_hash="SHA256:4f8e91a27b3c456890d9124e5fa67b8c",
    )

    # Return 403 Forbidden with full forensic context
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "error": "UNAUTHORIZED_MODIFICATION_ATTEMPT",
            "message": "Immutable historical statutory record cannot be altered after approval/commit.",
            "incident": incident,
        }
    )



@router.get("", response_model=list[LedgerEntryOut])
async def list_ledger(
    mine_site_id: UUID = Query(...),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    user: Optional[CurrentUser] = None,
    audit_svc: AuditService = Depends(get_audit_service),
):
    from app.infrastructure.repositories.audit_ledger_repository import AuditLedgerRepository
    repo = AuditLedgerRepository()
    entries = await repo.get_chain_for_mine(mine_site_id, limit=limit, offset=offset)
    return entries
