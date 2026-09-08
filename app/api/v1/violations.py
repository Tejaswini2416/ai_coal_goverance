"""Violations / CAPA router — state machine transitions."""
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import (
    CurrentUser,
    get_capa_service, get_capa_repo,
)
from app.domain.enums import CAPAState
from app.infrastructure.database.models import ViolationCAPAModel
from app.infrastructure.repositories.capa_repository import CAPARepository
from app.services.capa_service import CAPAService
from datetime import datetime

router = APIRouter(prefix="/violations", tags=["Violations & CAPA"])


class CAPACreate(BaseModel):
    id:            UUID | None = None
    inspection_id: UUID
    rule_id:       UUID
    description:   str
    mine_site_id:  UUID          # Required for audit ledger


class CAPATransitionRequest(BaseModel):
    to_state:      CAPAState
    mine_site_id:  UUID
    evidence_urls: list[str] | None = None
    assigned_to:   UUID | None      = None


class CAPAOut(BaseModel):
    id:            UUID
    inspection_id: UUID
    rule_id:       UUID
    capa_state:    str
    description:   str
    evidence_urls: list[str]
    version:       int
    assigned_to:   UUID | None
    verified_by:   UUID | None
    closed_at:     datetime | None
    created_at:    datetime

    class Config:
        from_attributes = True


@router.post("", response_model=CAPAOut, status_code=201)
async def create_capa(
    body:     CAPACreate,
    user:     CurrentUser,
    capa_svc: CAPAService = Depends(get_capa_service),
):
    capa = ViolationCAPAModel(
        id            = body.id or uuid.uuid4(),
        inspection_id = body.inspection_id,
        rule_id       = body.rule_id,
        description   = body.description,
        capa_state    = CAPAState.REPORTED.value,
        evidence_urls = [],
        version       = 1,
    )
    return await capa_svc.create(capa)


@router.post("/{capa_id}/transition", response_model=CAPAOut)
async def transition_capa(
    capa_id:  UUID,
    body:     CAPATransitionRequest,
    user:     CurrentUser,
    capa_svc: CAPAService = Depends(get_capa_service),
):
    """
    Apply a validated state machine transition to a CAPA.
    Illegal transitions return HTTP 409. Role restrictions return HTTP 403.
    """
    return await capa_svc.transition(
        capa_id      = capa_id,
        to_state     = body.to_state,
        actor_id     = UUID(user["user_id"]),
        actor_role   = user["role"],
        mine_site_id = body.mine_site_id,
        evidence_urls = body.evidence_urls,
        assigned_to  = body.assigned_to,
    )


@router.get("/{capa_id}", response_model=CAPAOut)
async def get_capa(
    capa_id:   UUID,
    user:      CurrentUser,
    capa_repo: CAPARepository = Depends(get_capa_repo),
):
    rec = await capa_repo.get_by_id(capa_id)
    if not rec:
        raise HTTPException(status_code=404, detail="CAPA not found.")
    return rec


@router.get("", response_model=list[CAPAOut])
async def list_capas(
    user:      CurrentUser,
    capa_repo: CAPARepository = Depends(get_capa_repo),
):
    return await capa_repo.list_all()


@router.get("/by-inspection/{inspection_id}", response_model=list[CAPAOut])
async def list_capas_by_inspection(
    inspection_id: UUID,
    user:          CurrentUser,
    capa_repo:     CAPARepository = Depends(get_capa_repo),
):
    return await capa_repo.list_by_inspection(inspection_id)
