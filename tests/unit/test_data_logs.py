"""
Unit Tests for Colliery Manager Data Logs & Tamper Detection Interceptor
"""
import uuid
import pytest
from datetime import datetime, timezone
from app.services.audit_service import AuditService
from app.domain.enums import AuditEntityType, AuditOperation
from app.api.v1.logs import compute_sha256


def test_compute_sha256_deterministic():
    """Validates that compute_sha256 is deterministic across dictionary key variations."""
    payload_a = {"station": "GDK-L1", "ch4": 0.28, "co": 8.5}
    payload_b = {"co": 8.5, "ch4": 0.28, "station": "GDK-L1"}
    
    hash_a = compute_sha256(payload_a)
    hash_b = compute_sha256(payload_b)
    
    assert hash_a == hash_b
    assert len(hash_a) == 64


@pytest.mark.asyncio
async def test_intercept_tamper_attempt_logs_block_and_dispatches_critical_alert():
    """Validates that intercept_tamper_attempt creates an immutable block and dispatches CRITICAL notifications."""
    audit_svc = AuditService()
    mine_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    entity_id = uuid.uuid4()
    
    result = await audit_svc.intercept_tamper_attempt(
        mine_site_id=mine_id,
        actor_id=actor_id,
        actor_name="N. Ramesh",
        actor_role="COLLIERY_MANAGER",
        colliery_name="Godavarikhani No. 11A Incline (GDK-11A)",
        target_model="TelemetryGasModel",
        entity_id=entity_id,
        target_field="co_ppm",
        old_value="68.0 ppm",
        new_value="18.0 ppm",
        reason="Falsification attempt on committed toxic gas log",
    )

    assert result["status"] == "UNAUTHORIZED_MODIFICATION_ATTEMPT"
    assert result["audit_block_sequence"] >= 1
    assert "audit_block_hash" in result
    assert "MINISTRY_AUDITOR" in result["target_roles"]
    assert "DGMS_INSPECTOR" in result["target_roles"]
    assert result["forensic_payload"]["target_field"] == "co_ppm"
