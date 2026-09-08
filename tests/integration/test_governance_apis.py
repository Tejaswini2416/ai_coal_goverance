"""Integration tests for Schedules, Notifications, Attendance, and PDF Reports APIs."""
from datetime import date, datetime, timedelta, timezone
import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.infrastructure.database.models import InspectionModel, MineSiteModel
from app.main import app
from app.services.auth_service import create_access_token


@pytest.mark.asyncio
async def test_schedule_api_flow(mine_site, inspector_user):
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Schedule
        create_payload = {
            "mine_site_id": str(mine_site.id),
            "assigned_inspector_id": str(inspector_user.id),
            "inspector_name": inspector_user.full_name,
            "inspection_title": "Haul Road Safety Audit",
            "inspection_type": "HAUL_ROAD_AUDIT",
            "scheduled_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=5)),
            "priority": "HIGH",
            "notes": "Verify berm height and signage",
        }
        res_create = await client.post("/api/v1/schedules", json=create_payload, headers=headers)
        assert res_create.status_code == 201
        sched_data = res_create.json()
        sched_id = sched_data["id"]
        assert sched_data["status"] == "ASSIGNED"

        # 2. List Schedules
        res_list = await client.get(f"/api/v1/schedules?mine_site_id={mine_site.id}", headers=headers)
        assert res_list.status_code == 200
        items = res_list.json()
        assert len(items) >= 1

        # 3. Update Status / Mark Completed
        completed_insp_id = str(uuid.uuid4())
        res_patch = await client.patch(
            f"/api/v1/schedules/{sched_id}/status",
            json={"status": "COMPLETED", "completed_inspection_id": completed_insp_id},
            headers=headers,
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "COMPLETED"
        assert res_patch.json()["completed_inspection_id"] == completed_insp_id

        # 4. Check Overdue
        res_overdue = await client.post("/api/v1/schedules/check-overdue", json={}, headers=headers)
        assert res_overdue.status_code == 200
        assert "escalated_count" in res_overdue.json()


@pytest.mark.asyncio
async def test_notifications_api_flow(mine_site, inspector_user):
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a schedule which triggers a notification
        create_payload = {
            "mine_site_id": str(mine_site.id),
            "assigned_inspector_id": str(inspector_user.id),
            "inspector_name": inspector_user.full_name,
            "inspection_title": "Ventilation Check",
            "inspection_type": "VENTILATION_CHECK",
            "scheduled_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=2)),
            "priority": "HIGH",
        }
        await client.post("/api/v1/schedules", json=create_payload, headers=headers)

        # 1. Fetch notifications
        res_notif = await client.get("/api/v1/notifications", headers=headers)
        assert res_notif.status_code == 200
        notifs = res_notif.json()
        assert len(notifs) >= 1
        target_notif = notifs[0]

        # 2. Acknowledge notification
        res_ack = await client.post(
            f"/api/v1/notifications/{target_notif['id']}/acknowledge",
            json={"acknowledgement_note": "Inspection acknowledged and queued for morning shift."},
            headers=headers,
        )
        assert res_ack.status_code == 200
        ack_data = res_ack.json()
        assert ack_data["is_acknowledged"] is True
        assert ack_data["acknowledgement_note"] == "Inspection acknowledged and queued for morning shift."

        # 3. Escalations endpoint
        res_esc = await client.get("/api/v1/notifications/escalations", headers=headers)
        assert res_esc.status_code == 200


@pytest.mark.asyncio
async def test_attendance_and_headcount_api(mine_site, inspector_user):
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Check-in Worker 1 (Underground)
        checkin_1 = {
            "worker_id": "W-901",
            "worker_name": "Ramesh Kumar",
            "mine_site_id": str(mine_site.id),
            "zone_type": "UNDERGROUND",
            "station_id": "STN-SEAM-3",
            "shift": "MORNING",
            "biometric_verified": True,
            "gas_level_exposure_ppm": 12.5,
        }
        res_in1 = await client.post("/api/v1/attendance/check-in", json=checkin_1, headers=headers)
        assert res_in1.status_code == 201
        att_rec1 = res_in1.json()
        assert att_rec1["status"] == "ACTIVE_INSIDE"

        # 2. Check-in Worker 2 (Surface)
        checkin_2 = {
            "worker_id": "W-902",
            "worker_name": "Suresh Patel",
            "mine_site_id": str(mine_site.id),
            "zone_type": "SURFACE",
            "shift": "MORNING",
            "biometric_verified": True,
            "gas_level_exposure_ppm": 0.0,
        }
        res_in2 = await client.post("/api/v1/attendance/check-in", json=checkin_2, headers=headers)
        assert res_in2.status_code == 201

        # 3. Check Headcount summary
        res_headcount = await client.get(f"/api/v1/attendance/active-headcount?mine_site_id={mine_site.id}", headers=headers)
        assert res_headcount.status_code == 200
        hc = res_headcount.json()
        assert hc["total_active_inside"] >= 2
        assert hc["underground_count"] >= 1
        assert hc["surface_count"] >= 1

        # 4. Check-out Worker 1
        res_out1 = await client.post(
            "/api/v1/attendance/check-out",
            json={"attendance_id": att_rec1["id"], "gas_level_exposure_ppm": 14.0},
            headers=headers,
        )
        assert res_out1.status_code == 200
        assert res_out1.json()["status"] == "CHECKED_OUT"


@pytest.mark.asyncio
async def test_pdf_reports_api(mine_site, inspector_user):
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)

    # Insert a test inspection
    test_insp = InspectionModel(
        id=uuid.uuid4(),
        mine_site_id=mine_site.id,
        inspector_id=inspector_user.id,
        title="Quarterly Shaft Safety Inspection",
        description="Comprehensive audit of shaft cages, ropes, and ventilation.",
        location_type="SURFACE_GPS",
        gps_location="POINT(82.5 21.5)",
        inspection_date=datetime.now(tz=timezone.utc),
        is_geofence_breached=False,
        version=1,
        idempotency_key=uuid.uuid4(),
    )
    await test_insp.insert()

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Download Inspection Dossier PDF
        res_pdf = await client.get(f"/api/v1/reports/inspection/{test_insp.id}/pdf", headers=headers)
        assert res_pdf.status_code == 200
        assert res_pdf.headers["content-type"] == "application/pdf"
        assert res_pdf.content.startswith(b"%PDF-")

        # 2. Download Compliance Certificate PDF
        res_cert = await client.get(f"/api/v1/reports/compliance/{mine_site.id}/pdf", headers=headers)
        assert res_cert.status_code == 200
        assert res_cert.headers["content-type"] == "application/pdf"
        assert res_cert.content.startswith(b"%PDF-")
