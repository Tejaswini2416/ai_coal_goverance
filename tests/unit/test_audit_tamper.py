"""
Unit Tests for Cryptographic Audit Ledger Integrity Verification & Tamper Detection
"""
import uuid
import pytest
from datetime import datetime, timezone

from app.domain.enums import AuditEntityType, AuditOperation
from app.infrastructure.database.models import AuditLedgerModel, MineSiteModel
from app.services.audit_service import AuditService, _compute_hash, GENESIS_HASH


@pytest.mark.asyncio
async def test_valid_three_block_audit_chain_passes():
    """Three sequential audit blocks with valid hashes should return is_valid == True."""
    mine_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    audit_svc = AuditService()

    # Block 1 (Seq 1)
    b1 = await audit_svc.append(
        mine_site_id=mine_id,
        entity_type=AuditEntityType.COMPLIANCE_SCHEDULE,
        entity_id=uuid.uuid4(),
        operation=AuditOperation.INSERT,
        payload={"rule_code": "CMR-2017-153", "category": "Ventilation"},
        actor_id=actor_id,
    )

    # Block 2 (Seq 2)
    b2 = await audit_svc.append(
        mine_site_id=mine_id,
        entity_type=AuditEntityType.INSPECTION,
        entity_id=uuid.uuid4(),
        operation=AuditOperation.INSERT,
        payload={"station": "GDK-11A-SHAFT", "ch4": 0.45, "co": 8.0},
        actor_id=actor_id,
    )

    # Block 3 (Seq 3)
    b3 = await audit_svc.append(
        mine_site_id=mine_id,
        entity_type=AuditEntityType.VIOLATION_CAPA,
        entity_id=uuid.uuid4(),
        operation=AuditOperation.UPDATE,
        payload={"capa_id": "c-001", "status": "ASSIGNED"},
        actor_id=actor_id,
    )

    result = await audit_svc.verify_ledger_integrity(str(mine_id))

    assert result.is_valid is True
    assert result.total_entries_verified == 3
    assert result.sequence_number is None
    assert result.tampered_record_id is None


@pytest.mark.asyncio
async def test_direct_payload_tampering_on_block_two_detected():
    """Mutating a payload field in MongoDB on block #2 must fail hash verification and identify block #2."""
    mine_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    audit_svc = AuditService()

    # 1. Create 3 valid sequential blocks
    b1 = await audit_svc.append(
        mine_site_id=mine_id,
        entity_type=AuditEntityType.INSPECTION,
        entity_id=uuid.uuid4(),
        operation=AuditOperation.INSERT,
        payload={"log": "Initial morning shift inspection"},
        actor_id=actor_id,
    )
    b2 = await audit_svc.append(
        mine_site_id=mine_id,
        entity_type=AuditEntityType.INSPECTION,
        entity_id=uuid.uuid4(),
        operation=AuditOperation.INSERT,
        payload={"station": "GDK-SEAM3", "ch4_reading": 0.95, "co_ppm": 32.0},
        actor_id=actor_id,
    )
    b3 = await audit_svc.append(
        mine_site_id=mine_id,
        entity_type=AuditEntityType.VIOLATION_CAPA,
        entity_id=uuid.uuid4(),
        operation=AuditOperation.INSERT,
        payload={"notice": "DGMS safety notice dispatched"},
        actor_id=actor_id,
    )

    # Verify initial chain is valid
    init_res = await audit_svc.verify_ledger_integrity(str(mine_id))
    assert init_res.is_valid is True

    # 2. Simulate direct unauthorized database tamper on Block #2:
    # An attacker alters "ch4_reading" from 0.95% down to 0.05% to hide statutory gas violation
    tampered_entry = await AuditLedgerModel.find_one(AuditLedgerModel.id == b2.id)
    assert tampered_entry is not None
    tampered_entry.payload_json["ch4_reading"] = 0.05  # Falsified reading
    await tampered_entry.save()

    # 3. Verify integrity: must catch tampering immediately
    tamper_res = await audit_svc.verify_ledger_integrity(str(mine_id))

    assert tamper_res.is_valid is False
    assert tamper_res.sequence_number == 2
    assert tamper_res.tampered_record_id == str(b2.id)
    assert tamper_res.expected_hash == b2.record_hash
    assert tamper_res.calculated_hash != b2.record_hash
    assert "Record content hash mismatch at Sequence #2" in tamper_res.message


@pytest.mark.asyncio
async def test_simulate_tamper_helper_endpoint_flow():
    """simulate_tamper method should mutate block and trigger immediate invalid status."""
    mine_id = uuid.uuid4()
    audit_svc = AuditService()

    sim_res = await audit_svc.simulate_tamper(
        mine_site_id=str(mine_id),
        sequence_number=1,
        tampered_field="gas_ppm",
        new_value=0.0,
    )

    assert sim_res["status"] == "tampered"
    assert sim_res["sequence_number"] == 1

    check_res = await audit_svc.verify_ledger_integrity(str(mine_id))
    assert check_res.is_valid is False
    assert check_res.sequence_number == 1
