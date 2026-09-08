"""
Unit & Integration Tests for Worker Leave Applications Portal (Mines Rules 1955).
"""
import uuid
from datetime import date, datetime
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.infrastructure.database.models import WorkerLeaveModel, NotificationModel
from app.services.auth_service import create_access_token


@pytest.mark.asyncio
async def test_worker_leave_submit_and_review_flow(mine_site, inspector_user):
    """Test worker leave application submission and manager approval lifecycle."""
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Worker Submits Leave Application
        payload = {
            "mine_site_id": str(mine_site.id),
            "worker_id": "W-104",
            "worker_name": "Rajesh Kumar Mandal",
            "leave_type": "EARNED_STATUTORY",
            "start_date": "2026-09-15",
            "end_date": "2026-09-18",
            "total_days": 4,
            "reason": "Statutory annual earned leave entitlement.",
            "relief_worker_id": "W-108",
            "relief_worker_name": "K. Shankaraiah",
        }

        resp = await client.post(
            "/api/v1/worker/leave-applications",
            json=payload,
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        leave_id = data["id"]
        assert data["status"] == "SUBMITTED"
        assert data["total_days"] == 4

        # Verify manager notification was emitted
        notifs = await NotificationModel.find(NotificationModel.category == "WORKER_LEAVE").to_list()
        assert len(notifs) >= 1
        assert notifs[0].recipient_role == "COLLIERY_MANAGER"

        # 2. Worker / Manager Lists Leaves
        list_resp = await client.get("/api/v1/worker/leave-applications", headers=headers)
        assert list_resp.status_code == 200
        leaves = list_resp.json()
        assert len(leaves) >= 1
        assert any(l["id"] == leave_id for l in leaves)

        # 3. Colliery Manager Approves Leave
        review_payload = {
            "status": "APPROVED",
            "review_notes": "Statutory relief sirdar assigned for morning shift.",
        }
        review_resp = await client.post(
            f"/api/v1/worker/leave-applications/{leave_id}/review",
            json=review_payload,
            headers=headers,
        )
        assert review_resp.status_code == 200
        reviewed_data = review_resp.json()
        assert reviewed_data["status"] == "APPROVED"
        assert reviewed_data["reviewed_by"] is not None
        assert "statutory relief" in reviewed_data["review_notes"].lower()
