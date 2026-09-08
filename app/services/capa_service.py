"""
CAPA State Machine Service.
Enforces allowed transitions and role-based access for state changes.
"""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from app.domain.enums import (
    CAPA_ALLOWED_TRANSITIONS,
    CAPA_REOPEN_ROLES,
    CAPAState,
    UserRole,
    AuditOperation,
    AuditEntityType,
)
from app.infrastructure.database.models import ViolationCAPAModel
from app.infrastructure.repositories.capa_repository import CAPARepository
from app.services.audit_service import AuditService


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class CAPAService:
    def __init__(
        self,
        capa_repo:    CAPARepository,
        audit_service: "AuditService",
    ) -> None:
        self._repo  = capa_repo
        self._audit = audit_service

    async def transition(
        self,
        capa_id:      UUID,
        to_state:     CAPAState,
        actor_id:     UUID,
        actor_role:   str,
        mine_site_id: UUID,
        evidence_urls: list[str] | None = None,
        assigned_to:   UUID | None = None,
    ) -> ViolationCAPAModel:
        """
        Apply a validated state transition to a CAPA record.
        Raises HTTP 409 for illegal transitions.
        Raises HTTP 403 for unauthorized role.
        """
        capa = await self._repo.get_for_update(capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail=f"CAPA '{capa_id}' not found.")

        from_state = CAPAState(capa.capa_state)
        self._assert_transition_allowed(from_state, to_state, actor_role)

        # Enforce evidence requirement at RECTIFICATION_SUBMITTED
        if to_state == CAPAState.RECTIFICATION_SUBMITTED:
            urls = evidence_urls or capa.evidence_urls or []
            if not urls:
                raise HTTPException(
                    status_code=422,
                    detail="evidence_urls must be non-empty when submitting rectification.",
                )
            capa.evidence_urls = urls

        # Enforce verifier role at VERIFIED
        if to_state == CAPAState.VERIFIED:
            if not UserRole(actor_role).minimum_capa_verification_role():
                raise HTTPException(
                    status_code=403,
                    detail=f"Role '{actor_role}' is not authorized to verify CAPA submissions.",
                )
            capa.verified_by = actor_id
            capa.verified_at = _utcnow()

        if to_state == CAPAState.CLOSED:
            capa.closed_at = _utcnow()

        if to_state == CAPAState.ASSIGNED and assigned_to:
            capa.assigned_to = assigned_to

        prev_state      = capa.capa_state
        capa.capa_state = to_state.value
        capa.version   += 1
        capa.updated_at = _utcnow()

        await self._repo.update(capa)

        # Append to tamper-evident audit ledger
        await self._audit.append(
            mine_site_id = mine_site_id,
            entity_type  = AuditEntityType.VIOLATION_CAPA,
            entity_id    = capa.id,
            operation    = AuditOperation.STATUS_CHANGE,
            payload      = {
                "from_state": prev_state,
                "to_state":   to_state.value,
                "actor_id":   str(actor_id),
            },
            actor_id     = actor_id,
        )

        return capa

    @staticmethod
    def _assert_transition_allowed(
        from_state: CAPAState,
        to_state:   CAPAState,
        actor_role: str,
    ) -> None:
        # Re-open: any → REPORTED (SUBSIDIARY_ADMIN+ only)
        if to_state == CAPAState.REPORTED:
            if UserRole(actor_role) not in CAPA_REOPEN_ROLES:
                raise HTTPException(
                    status_code=403,
                    detail=f"Only SUBSIDIARY_ADMIN or MINISTRY_AUDITOR can re-open a CAPA.",
                )
            return

        allowed = CAPA_ALLOWED_TRANSITIONS.get(from_state, set())
        if to_state not in allowed:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Illegal CAPA transition: '{from_state.value}' → '{to_state.value}'. "
                    f"Allowed transitions from '{from_state.value}': "
                    f"{[s.value for s in allowed] or 'none (terminal state)'}."
                ),
            )

    async def create(self, capa: ViolationCAPAModel) -> ViolationCAPAModel:
        created = await self._repo.create(capa)
        return created

    async def get(self, capa_id: UUID) -> ViolationCAPAModel | None:
        return await self._repo.get_by_id(capa_id)
