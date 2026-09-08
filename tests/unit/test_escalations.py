"""
Unit & Integration Tests for Manager Official Escalation Dispatch System.
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.infrastructure.database.models import NotificationModel, AuditLedgerModel
from app.services.auth_service import create_access_token
from app.services.email_service import EmailService


@pytest.mark.asyncio
async def test_email_service_formatting():
    """Test EmailService builds formatted text and HTML statutory bodies."""
    svc = EmailService()
    recipients = svc.resolve_recipient_emails(["MINISTRY_AUDITOR", "DGMS_INSPECTOR"])
    assert "ministry.auditor@coal.gov.in" in recipients
    assert "dgms.inspector.south@dgms.gov.in" in recipients

    content = svc.build_statutory_email_body(
        sender_name="Er. Ramesh Rao",
        sender_role="COLLIERY_MANAGER",
        sender_email="colliery.manager@scclmines.com",
        colliery_name="Ramagundam RG-OCP 3",
        priority="STATUTORY_EMERGENCY",
        category="VENTILATION_CRISIS",
        subject="Emergency Methane Influx at Panel 7",
        message_body="Immediate ventilation booster failure detected; evacuating seam.",
        risk_snapshot={"overall_risk_score": 85, "ch4_pct": 1.45, "co_ppm": 22.0},
        ledger_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    assert "STATUTORY ESCALATION DISPATCH" in content["text"]
    assert "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" in content["text"]
    assert "STATUTORY_EMERGENCY" in content["html"]
    assert "Emergency Methane Influx" in content["html"]


@pytest.mark.asyncio
async def test_escalation_dispatch_api_flow(mine_site, inspector_user):
    """Test POST /api/v1/escalations/dispatch creates notifications and audit block."""
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "mine_site_id": str(mine_site.id),
        "recipient_roles": ["MINISTRY_AUDITOR", "DGMS_INSPECTOR"],
        "subject": "Statutory Notice: Seam 3 Strata Pressure Warning",
        "priority": "URGENT",
        "category": "SAFETY_BREACH",
        "message_body": "Strata monitoring sensors indicate 15% increase in convergence velocity along Gallery 4.",
        "include_risk_snapshot": True,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/escalations/dispatch",
            json=payload,
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "DISPATCHED_AND_LOGGED"
        assert data["notifications_created"] == 2
        assert len(data["target_emails"]) == 2
        assert data["audit_block_hash"] is not None

        # Verify in-app notifications were created in MongoDB
        notifs = await NotificationModel.find(NotificationModel.category == "OFFICIAL_ESCALATION").to_list()
        assert len(notifs) >= 2
        roles = [n.recipient_role for n in notifs]
        assert "MINISTRY_AUDITOR" in roles
        assert "DGMS_INSPECTOR" in roles

        # Verify audit ledger block was appended
        audit_records = await AuditLedgerModel.find(AuditLedgerModel.entity_type == "official_escalation").to_list()
        assert len(audit_records) >= 1
        assert audit_records[0].current_hash is not None

        # Verify history endpoint
        history_resp = await client.get("/api/v1/escalations/history", headers=headers)
        assert history_resp.status_code == 200
        history = history_resp.json()
        assert len(history) >= 2
