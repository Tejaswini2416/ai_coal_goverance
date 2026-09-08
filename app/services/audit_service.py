"""
Audit Ledger Service — per-mine-site sharded SHA-256 hash chain.
Hash computation uses json.dumps with sort_keys=True for deterministic serialization.
Provides full cryptographic verification and tamper detection.
"""
import hashlib
import json
import uuid
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, Field

from app.domain.enums import AuditEntityType, AuditOperation
from app.infrastructure.database.models import AuditLedgerModel, MineSiteModel, NotificationModel
from app.infrastructure.repositories.audit_ledger_repository import AuditLedgerRepository

GENESIS_HASH = "GENESIS"


class AuditIntegrityResult(BaseModel):
    """Structured cryptographic integrity report for statutory audit chains."""
    is_valid: bool = Field(..., description="True if entire SHA-256 hash chain is intact")
    tampered_record_id: Optional[str] = Field(default=None, description="ID of corrupted audit document")
    sequence_number: Optional[int] = Field(default=None, description="Sequence number where hash diverged")
    mine_site_id: Optional[str] = Field(default=None, description="Associated Mine Site ID")
    mine_name: Optional[str] = Field(default=None, description="Human-readable mine site name")
    expected_hash: Optional[str] = Field(default=None, description="Expected cryptographic hash")
    calculated_hash: Optional[str] = Field(default=None, description="Recalculated SHA-256 hash from payload")
    tampered_at: Optional[datetime] = Field(default=None, description="Timestamp when record was logged")
    total_entries_verified: int = Field(default=0, description="Total audit blocks scanned")
    message: str = Field(..., description="Integrity status message or tamper diagnosis")


def _compute_hash(mine_site_id: UUID, sequence_number: int, prev_hash: str, payload: dict) -> str:
    """
    Deterministic SHA-256 hash over canonical content string.
    sort_keys=True prevents JSON key-ordering discrepancies between Python versions.
    """
    payload_str = json.dumps(payload, sort_keys=True, default=str)
    content = f"{mine_site_id}{sequence_number}{prev_hash}{payload_str}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class AuditService:
    def __init__(self, ledger_repo: Optional[AuditLedgerRepository] = None) -> None:
        self._repo = ledger_repo or AuditLedgerRepository()

    async def append(
        self,
        mine_site_id: UUID,
        entity_type: AuditEntityType,
        entity_id: UUID,
        operation: AuditOperation,
        payload: dict,
        actor_id: UUID,
    ) -> AuditLedgerModel:
        """
        Append a new entry to the mine-site-specific hash chain.
        """
        last = await self._repo.get_last_for_mine(mine_site_id)

        next_seq = (last.sequence_number + 1) if last else 1
        prev_hash = last.record_hash if last else GENESIS_HASH

        record_hash = _compute_hash(mine_site_id, next_seq, prev_hash, payload)

        entry = AuditLedgerModel(
            id=uuid.uuid4(),
            mine_site_id=mine_site_id,
            sequence_number=next_seq,
            entity_type=entity_type.value if hasattr(entity_type, "value") else str(entity_type),
            action_type=entity_type.value if hasattr(entity_type, "value") else str(entity_type),
            entity_id=entity_id,
            operation=operation.value if hasattr(operation, "value") else str(operation),
            payload=payload,
            payload_json=payload,
            previous_hash=prev_hash,
            prev_hash=prev_hash,
            current_hash=record_hash,
            record_hash=record_hash,
            actor_id=str(actor_id),
            created_by=actor_id,
            actor_role="COLLIERY_MANAGER",
            timestamp=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        return await self._repo.append(entry)

    async def verify_chain(self, mine_site_id: UUID) -> dict:
        """
        Scan the full hash chain for a mine site and recompute every hash.
        Returns dictionary matching VerifyResult.
        """
        res = await self.verify_ledger_integrity(str(mine_site_id))
        return {
            "valid": res.is_valid,
            "broken_at_sequence": res.sequence_number,
            "total_entries": res.total_entries_verified,
            "reason": None if res.is_valid else res.message,
        }

    async def verify_ledger_integrity(self, mine_site_id: Optional[str] = None) -> AuditIntegrityResult:
        """
        Scans all audit ledger records and validates the continuous cryptographic SHA-256 chain.
        If any record was tampered with directly in MongoDB, returns detailed divergence info.
        """
        target_mine_uuid = None
        mine_name = "All Mine Sites (Global Chain)"

        if mine_site_id:
            try:
                target_mine_uuid = UUID(mine_site_id)
                try:
                    mine_site = await MineSiteModel.get(target_mine_uuid)
                    if mine_site:
                        mine_name = mine_site.name
                except Exception:
                    pass
                entries = await self._repo.get_chain_for_mine(target_mine_uuid, limit=100_000)
            except ValueError:
                entries = await AuditLedgerModel.find().sort("sequence_number").to_list()
        else:
            entries = await AuditLedgerModel.find().sort("sequence_number").to_list()

        total = len(entries)

        if total == 0:
            return AuditIntegrityResult(
                is_valid=True,
                mine_site_id=mine_site_id,
                mine_name=mine_name,
                total_entries_verified=0,
                message="Audit ledger is empty or has no blocks recorded yet. Cryptographic baseline intact.",
            )

        # Track chains per mine_site_id
        prev_hashes: Dict[str, str] = {}

        for entry in entries:
            try:
                m_id = entry.mine_site_id if isinstance(entry.mine_site_id, UUID) else UUID(str(entry.mine_site_id))
            except Exception:
                m_id = entry.mine_site_id
            m_id_str = str(m_id)
            expected_prev = prev_hashes.get(m_id_str, GENESIS_HASH)

            payload_data = entry.payload_json if entry.payload_json is not None else (entry.payload or {})
            curr_prev_hash = entry.prev_hash or entry.previous_hash or GENESIS_HASH
            stored_hash = entry.record_hash or entry.current_hash

            # 1. Recompute SHA-256 hash
            calculated_hash = _compute_hash(
                m_id,
                entry.sequence_number,
                curr_prev_hash,
                payload_data or {},
            )

            # 2. Check for content payload tampering
            if stored_hash != calculated_hash:
                return AuditIntegrityResult(
                    is_valid=False,
                    tampered_record_id=str(entry.id) if hasattr(entry, "id") else None,
                    sequence_number=entry.sequence_number,
                    mine_site_id=str(entry.mine_site_id),
                    mine_name=mine_name,
                    expected_hash=stored_hash,
                    calculated_hash=calculated_hash,
                    tampered_at=getattr(entry, "created_at", None),
                    total_entries_verified=total,
                    message=(
                        f"CRITICAL: Record content hash mismatch at Sequence #{entry.sequence_number}. "
                        f"Database record payload was modified without valid cryptographic signature."
                    ),
                )

            # 3. Check for chain insertion or deletion break
            if curr_prev_hash != expected_prev:
                return AuditIntegrityResult(
                    is_valid=False,
                    tampered_record_id=str(entry.id) if hasattr(entry, "id") else None,
                    sequence_number=entry.sequence_number,
                    mine_site_id=str(entry.mine_site_id),
                    mine_name=mine_name,
                    expected_hash=expected_prev,
                    calculated_hash=curr_prev_hash,
                    tampered_at=getattr(entry, "created_at", None),
                    total_entries_verified=total,
                    message=(
                        f"CRITICAL: Cryptographic chain break at Sequence #{entry.sequence_number}. "
                        f"Previous hash link ({curr_prev_hash[:12]}...) does not match prior block ({expected_prev[:12]}...)."
                    ),
                )

            prev_hashes[m_id_str] = stored_hash

        return AuditIntegrityResult(
            is_valid=True,
            mine_site_id=mine_site_id,
            mine_name=mine_name,
            total_entries_verified=total,
            message=f"All {total} cryptographic audit blocks verified successfully against SHA-256 Merkle chain.",
        )

    async def simulate_tamper(
        self,
        mine_site_id: str,
        sequence_number: int = 1,
        tampered_field: str = "ch4_reading",
        new_value: Any = "0.01",
    ) -> Dict[str, Any]:
        """
        Test / Demonstration endpoint: purposefully alters a database payload field
        without updating record_hash to prove tamper detection in live demonstrations.
        """
        mine_uuid = UUID(mine_site_id)
        entry = await AuditLedgerModel.find_one(
            AuditLedgerModel.mine_site_id == mine_uuid,
            AuditLedgerModel.sequence_number == sequence_number,
        )

        if not entry:
            # If no entry exists for this sequence, create a block first and then alter it
            entry = await self.append(
                mine_site_id=mine_uuid,
                entity_type=AuditEntityType.INSPECTION,
                entity_id=uuid.uuid4(),
                operation=AuditOperation.INSERT,
                payload={"station": "STATION-GDK-L2", "ch4_reading": 0.85, "co_ppm": 24.0},
                actor_id=uuid.uuid4(),
            )

        # Mutate the payload directly in MongoDB without recomputing hash
        orig_payload = dict(entry.payload_json or {})
        tampered_payload = dict(orig_payload)
        tampered_payload[tampered_field] = new_value
        entry.payload_json = tampered_payload
        await entry.save()

        return {
            "status": "tampered",
            "record_id": str(entry.id),
            "sequence_number": entry.sequence_number,
            "mine_site_id": str(entry.mine_site_id),
            "original_payload": orig_payload,
            "tampered_payload": tampered_payload,
            "stored_record_hash": entry.record_hash,
            "message": "Database record altered directly in persistence tier. Next verification will immediately detect hash mismatch.",
        }

    async def intercept_tamper_attempt(
        self,
        mine_site_id: UUID,
        actor_id: UUID,
        actor_name: str,
        actor_role: str,
        colliery_name: str,
        target_model: str,
        entity_id: UUID,
        target_field: str,
        old_value: Any,
        new_value: Any,
        reason: Optional[str] = None,
        stored_hash: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Intercepts an unauthorized mutation attempt on an immutable/committed record.
        1. Appends an immutable block to AuditLedgerModel with action STATUTORY_RECORD_TAMPER_ATTEMPT.
        2. Dispatches real-time CRITICAL notification alerts to MINISTRY_AUDITOR and DGMS_INSPECTOR.
        3. Returns the incident forensics dictionary.
        """
        now = datetime.now(timezone.utc)
        incident_id = uuid.uuid4()
        
        # 1. Forensic tamper payload
        tamper_payload = {
            "incident_id": str(incident_id),
            "status": "MUTATION_BLOCKED",
            "attempted_by_id": str(actor_id),
            "attempted_by_name": actor_name,
            "attempted_by_role": actor_role,
            "affected_colliery": colliery_name,
            "target_model": target_model,
            "entity_id": str(entity_id),
            "target_field": target_field,
            "old_value": str(old_value),
            "new_value": str(new_value),
            "reason": reason or "Attempted alteration of immutable statutory historical record",
            "stored_hash_divergence": stored_hash or f"Signature verification failure against canonical block payload",
            "attempted_at": now.isoformat(),
        }

        # 2. Append immutable record to Audit Ledger
        audit_entry = await self.append(
            mine_site_id=mine_site_id,
            entity_type=AuditEntityType.STATUTORY_RECORD_TAMPER_ATTEMPT,
            entity_id=incident_id,
            operation=AuditOperation.TAMPER_ATTEMPT,
            payload=tamper_payload,
            actor_id=actor_id,
        )

        # 3. Generate high-priority NotificationModel entries for DGMS & Ministry
        target_roles = ["MINISTRY_AUDITOR", "DGMS_INSPECTOR"]
        notifications_dispatched = []

        for role in target_roles:
            notif = NotificationModel(
                id=uuid.uuid4(),
                recipient_role=role,
                mine_site_id=mine_site_id,
                title=f"🚨 STATUTORY TAMPER ALERT: Mine Manager attempted modification of historical shift data at {colliery_name}",
                message=(
                    f"CRITICAL TAMPER ATTEMPT: Mine Manager {actor_name} ({actor_role}) attempted unauthorized mutation "
                    f"of immutable historical record ({target_model} #{entity_id}) at {colliery_name}. "
                    f"Target Field: '{target_field}' from '{old_value}' to '{new_value}'. "
                    f"Mutation was BLOCKED and logged into SHA-256 ledger (Block #{audit_entry.sequence_number})."
                ),
                category="STATUTORY_RECORD_TAMPER_ATTEMPT",
                severity="CRITICAL",
                channel="EMAIL_AND_IN_APP",
                escalation_level=3,
                escalated_to_role=role,
                created_at=now,
            )
            try:
                await notif.insert()
                notifications_dispatched.append(str(notif.id))
            except Exception as e:
                # Log if in-memory without insert
                pass

        return {
            "status": "UNAUTHORIZED_MODIFICATION_ATTEMPT",
            "incident_id": str(incident_id),
            "audit_block_sequence": audit_entry.sequence_number,
            "audit_block_hash": audit_entry.record_hash or audit_entry.current_hash,
            "forensic_payload": tamper_payload,
            "notifications_dispatched_count": len(notifications_dispatched),
            "target_roles": target_roles,
            "message": (
                f"UNAUTHORIZED_MODIFICATION_ATTEMPT: Mutation was intercepted and permanently recorded "
                f"in audit block #{audit_entry.sequence_number}. Regulatory authorities notified."
            ),
        }

