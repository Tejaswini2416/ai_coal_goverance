"""Unit tests for PDFReportService & NotificationService."""
import uuid
from datetime import datetime, timezone
import pytest

from app.infrastructure.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService
from app.services.pdf_report_service import PDFReportService


@pytest.mark.asyncio
async def test_notification_lifecycle_and_acknowledgment(mine_site, inspector_user):
    repo = NotificationRepository()
    service = NotificationService(repo)

    notif = await service.emit_alert(
        mine_site_id=mine_site.id,
        title="Geofence Hazard Alert",
        message="Vehicle #42 entered blast zone",
        category="GEOFENCE_BREACH",
        severity="CRITICAL",
        recipient_user_id=inspector_user.id,
        recipient_role="DGMS_INSPECTOR",
    )

    assert notif.id is not None
    assert notif.is_acknowledged is False
    assert notif.is_read is False

    # Acknowledge with action note
    ack_user_id = uuid.uuid4()
    ack = await service.acknowledge_notification(
        notification_id=notif.id,
        acknowledged_by=ack_user_id,
        acknowledged_by_name="Colliery Manager Singh",
        acknowledgement_note="Vehicle halted and redirected immediately.",
    )

    assert ack.is_acknowledged is True
    assert ack.is_read is True
    assert ack.acknowledged_by_name == "Colliery Manager Singh"
    assert ack.acknowledgement_note == "Vehicle halted and redirected immediately."


def test_pdf_generation_dossier_and_certificate():
    # Test Inspection Dossier PDF
    insp_data = {
        "id": str(uuid.uuid4()),
        "title": "Annual Safety Audit",
        "description": "Comprehensive safety audit of shaft 4 and haul roads.",
        "location_type": "SURFACE_GPS",
        "is_geofence_breached": False,
        "inspection_date": "2026-09-05",
        "inspector_name": "DGMS Inspector Sharma",
        "idempotency_hash": "a1b2c3d4e5f67890123456789abcdef",
    }
    mine_data = {
        "id": str(uuid.uuid4()),
        "name": "Bokaro Open Cast Mine",
        "code": "BOK-01",
        "subsidiary": "CCL",
        "mine_type": "Open Cast",
    }
    violations = [
        {
            "rule_code": "CMR-2017-130",
            "severity": "HIGH",
            "description": "Berm height below standard on haul road bend.",
            "status": "NOTICE_ISSUED",
        }
    ]

    pdf_bytes = PDFReportService.generate_inspection_dossier(insp_data, mine_data, violations)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF-")

    # Test Compliance Certificate PDF
    cert_bytes = PDFReportService.generate_compliance_certificate(
        mine_data=mine_data,
        score_data={"overall_score": 96.0, "open_capa_count": 0},
    )
    assert len(cert_bytes) > 500
    assert cert_bytes.startswith(b"%PDF-")
