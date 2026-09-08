"""
Unit Tests for SMS Emergency Alert Dispatch Service (SIH26024).
Verifies:
1. SMSService formats and logs mock SMS text message alerts.
2. AlertDispatchService triggers multi-recipient SMS for:
   - Tamper Ledger Divergence
   - Worker Emergency Stop Grievance
   - Predictive 72h Spontaneous Combustion / Gas Warning
"""
import pytest
from app.services.sms_service import SMSService
from app.services.alert_dispatch_service import AlertDispatchService


@pytest.mark.asyncio
async def test_sms_service_mock_dispatch():
    """Verify SMSService dispatches mock SMS and logs structured content."""
    service = SMSService()
    recipients = ["+919876543210", "+919876543211", "+919876543212"]
    message = "🚨 DGMS STATUTORY ALERT: Test notification for mine site."
    
    result = await service.dispatch_sms(recipients, message)
    assert result["status"] == "MOCKED_SUCCESS"
    assert len(result["recipients"]) == 3
    assert result["message_body"] == message
    assert result["sender_id"] == "COALGOV"


@pytest.mark.asyncio
async def test_alert_dispatch_tamper_event():
    """Verify AlertDispatchService sends tamper alerts to Ministry, Inspector & Manager."""
    dispatcher = AlertDispatchService()
    res = await dispatcher.trigger_tamper_alert(
        mine_name="Godavarikhani No. 11A Incline (SCCL)",
        sequence_number=42,
        incident_id="inc-test-01",
    )
    assert res["event"] == "TAMPER_LEDGER_ALERT"
    assert "MINISTRY_AUDITOR" in res["target_roles"]
    assert "DGMS_INSPECTOR" in res["target_roles"]
    assert "COLLIERY_MANAGER" in res["target_roles"]
    assert "+917842295449" in res["recipients"]
    assert "+918919912916" in res["recipients"]
    assert len(res["recipients"]) >= 3
    assert res["sms_dispatch"]["status"] == "MOCKED_SUCCESS"
    assert "Ledger block #42 invalidated" in res["sms_dispatch"]["message_body"]


@pytest.mark.asyncio
async def test_alert_dispatch_worker_emergency_halt():
    """Verify AlertDispatchService sends emergency pit alert to Manager and Overman."""
    dispatcher = AlertDispatchService()
    res = await dispatcher.trigger_worker_emergency_halt(
        mine_name="Ramagundam OCP-3",
        location_desc="Gallery 4, 380m Level",
        worker_name="K. Shankaraiah",
    )
    assert res["event"] == "WORKER_EMERGENCY_HALT"
    assert "COLLIERY_MANAGER" in res["target_roles"]
    assert "SHIFT_OVERMAN" in res["target_roles"]
    assert res["sms_dispatch"]["status"] == "MOCKED_SUCCESS"
    assert "Gallery 4, 380m Level" in res["sms_dispatch"]["message_body"]


@pytest.mark.asyncio
async def test_alert_dispatch_predictive_gas_warning():
    """Verify AlertDispatchService sends early warning to Manager and Inspector."""
    dispatcher = AlertDispatchService()
    res = await dispatcher.trigger_predictive_gas_warning(
        mine_name="Kasipet Underground Mine",
        hours=36,
        metric_name="CO rate > 3ppm/hr",
    )
    assert res["event"] == "PREDICTIVE_GAS_WARNING"
    assert "COLLIERY_MANAGER" in res["target_roles"]
    assert "DGMS_INSPECTOR" in res["target_roles"]
    assert res["sms_dispatch"]["status"] == "MOCKED_SUCCESS"
    assert "36h" in res["sms_dispatch"]["message_body"]


@pytest.mark.asyncio
async def test_escalation_test_sms_api_endpoint():
    """Verify POST /api/v1/escalations/test-sms diagnostic testing endpoint."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test TAMPER_ALERT
        res = await client.post(
            "/api/v1/escalations/test-sms",
            json={
                "event_type": "TAMPER_ALERT",
                "mine_name": "Godavarikhani No. 11A Incline",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        assert data["event_type"] == "TAMPER_ALERT"
        assert "+917842295449" in data["recipients"]
        assert "+918919912916" in data["recipients"]

        # 2. Test WORKER_EMERGENCY
        res2 = await client.post(
            "/api/v1/escalations/test-sms",
            json={
                "event_type": "WORKER_EMERGENCY",
                "mine_name": "Kasipet Underground Mine",
            },
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["status"] == "SUCCESS"
        assert data2["event_type"] == "WORKER_EMERGENCY"
        assert "COLLIERY_MANAGER" in data2["target_roles"]

