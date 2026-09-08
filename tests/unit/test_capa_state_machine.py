"""
Unit tests — CAPA State Machine (all legal and illegal transitions).
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.domain.enums import CAPAState, UserRole
from app.services.capa_service import CAPAService


def _mock_capa(state: CAPAState, evidence_urls=None):
    capa = MagicMock()
    capa.id            = uuid.uuid4()
    capa.capa_state    = state.value
    capa.evidence_urls = evidence_urls or []
    capa.version       = 1
    return capa


def _make_service():
    repo  = MagicMock()
    audit = MagicMock()
    audit.append = AsyncMock()
    return CAPAService(repo, audit)


# ── Legal Transitions ─────────────────────────────────────────────────────────

@pytest.mark.parametrize("from_state,to_state", [
    (CAPAState.REPORTED,               CAPAState.NOTICE_ISSUED),
    (CAPAState.NOTICE_ISSUED,          CAPAState.ASSIGNED),
    (CAPAState.ASSIGNED,               CAPAState.RECTIFICATION_SUBMITTED),
    (CAPAState.RECTIFICATION_SUBMITTED, CAPAState.VERIFIED),
    (CAPAState.VERIFIED,               CAPAState.CLOSED),
])
def test_legal_transitions_allowed(from_state, to_state):
    """Legal transitions must not raise."""
    svc = _make_service()
    # Should not raise
    svc._assert_transition_allowed(from_state, to_state, UserRole.DGMS_INSPECTOR.value)


# ── Illegal Transitions ────────────────────────────────────────────────────────

@pytest.mark.parametrize("from_state,to_state", [
    (CAPAState.REPORTED,   CAPAState.CLOSED),         # skip multiple states
    (CAPAState.REPORTED,   CAPAState.VERIFIED),
    (CAPAState.ASSIGNED,   CAPAState.CLOSED),          # skip RECTIFICATION_SUBMITTED
    (CAPAState.CLOSED,     CAPAState.NOTICE_ISSUED),   # terminal → non-REPORTED
    (CAPAState.VERIFIED,   CAPAState.ASSIGNED),        # backwards
])
def test_illegal_transitions_raise_409(from_state, to_state):
    svc = _make_service()
    with pytest.raises(HTTPException) as exc_info:
        svc._assert_transition_allowed(from_state, to_state, UserRole.DGMS_INSPECTOR.value)
    assert exc_info.value.status_code == 409


# ── Re-open Privilege ─────────────────────────────────────────────────────────

def test_reopen_allowed_for_ministry_auditor():
    svc = _make_service()
    # Should not raise — MINISTRY_AUDITOR can re-open
    svc._assert_transition_allowed(CAPAState.VERIFIED, CAPAState.REPORTED, UserRole.MINISTRY_AUDITOR.value)


def test_reopen_blocked_for_contractor_admin():
    svc = _make_service()
    with pytest.raises(HTTPException) as exc_info:
        svc._assert_transition_allowed(CAPAState.VERIFIED, CAPAState.REPORTED, UserRole.CONTRACTOR_ADMIN.value)
    assert exc_info.value.status_code == 403


# ── Evidence Requirement ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rectification_requires_evidence():
    """ASSIGNED → RECTIFICATION_SUBMITTED must reject if no evidence_urls."""
    svc  = _make_service()
    capa = _mock_capa(CAPAState.ASSIGNED, evidence_urls=[])
    svc._repo.get_for_update = AsyncMock(return_value=capa)

    with pytest.raises(HTTPException) as exc_info:
        await svc.transition(
            capa_id      = capa.id,
            to_state     = CAPAState.RECTIFICATION_SUBMITTED,
            actor_id     = uuid.uuid4(),
            actor_role   = UserRole.COLLIERY_MANAGER.value,
            mine_site_id = uuid.uuid4(),
            evidence_urls = [],   # ← empty
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_rectification_accepted_with_evidence():
    """ASSIGNED → RECTIFICATION_SUBMITTED accepted when evidence_urls provided."""
    svc  = _make_service()
    capa = _mock_capa(CAPAState.ASSIGNED, evidence_urls=[])
    capa.updated_at = None
    svc._repo.get_for_update = AsyncMock(return_value=capa)
    svc._repo.update         = AsyncMock(return_value=capa)

    result = await svc.transition(
        capa_id       = capa.id,
        to_state      = CAPAState.RECTIFICATION_SUBMITTED,
        actor_id      = uuid.uuid4(),
        actor_role    = UserRole.COLLIERY_MANAGER.value,
        mine_site_id  = uuid.uuid4(),
        evidence_urls = ["https://s3.example.com/photo1.jpg"],
    )
    assert result.capa_state == CAPAState.RECTIFICATION_SUBMITTED.value


# ── Verifier Role ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_verification_allowed_for_colliery_manager():
    svc  = _make_service()
    capa = _mock_capa(CAPAState.RECTIFICATION_SUBMITTED, evidence_urls=["url"])
    svc._repo.get_for_update = AsyncMock(return_value=capa)
    svc._repo.update         = AsyncMock(return_value=capa)

    res = await svc.transition(
        capa_id      = capa.id,
        to_state     = CAPAState.VERIFIED,
        actor_id     = uuid.uuid4(),
        actor_role   = UserRole.COLLIERY_MANAGER.value,
        mine_site_id = uuid.uuid4(),
    )
    assert res.capa_state == CAPAState.VERIFIED.value


@pytest.mark.asyncio
async def test_verification_blocked_for_field_worker():
    svc  = _make_service()
    capa = _mock_capa(CAPAState.RECTIFICATION_SUBMITTED, evidence_urls=["url"])
    svc._repo.get_for_update = AsyncMock(return_value=capa)

    with pytest.raises(HTTPException) as exc_info:
        await svc.transition(
            capa_id      = capa.id,
            to_state     = CAPAState.VERIFIED,
            actor_id     = uuid.uuid4(),
            actor_role   = UserRole.FIELD_WORKER.value,
            mine_site_id = uuid.uuid4(),
        )
    assert exc_info.value.status_code == 403
