"""
Unit tests for the 5 newly implemented SIH26024 Statutory & Operational Capabilities:
1. Automatic DGMS & Ministry Tamper Alert Notification Pipeline
2. Dedicated Data Logs API (Atmospheric, Worker Muster, Mine Casts) & Tamper Interception
3. Colliery Manager-to-Ministry Direct Escalation Memo Dispatch
4. 72-Hour Predictive AI Safety & Hazard Forecasting Engine
5. Real-time Risk Forecast integration
"""
import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.domain.enums import (
    AuditEntityType,
    AuditOperation,
    UserRole,
)
from app.domain.predictive_ai import PredictiveSafetyForecaster
from app.infrastructure.database.models import (
    AuditLedgerModel,
    NotificationModel,
    TenantModel,
    UserModel,
    TelemetryGasModel,
    WorkerAttendanceModel,
    MineCastExtractionModel,
)
from app.services.auth_service import create_access_token, hash_password


@pytest.fixture
def auth_headers(inspector_user: UserModel) -> dict:
    token = create_access_token(inspector_user)
    return {
        "Authorization": f"Bearer {token}",
        "X-Tenant-Path": inspector_user.tenant_path,
    }


@pytest.fixture
async def manager_user(ministry_tenant: TenantModel) -> UserModel:
    u = UserModel(
        id=uuid.uuid4(),
        tenant_id=ministry_tenant.id,
        tenant_path="MOC",
        email="manager@sccl.gov.in",
        full_name="P. Ramesh (Colliery Manager)",
        role=UserRole.COLLIERY_MANAGER.value,
        hashed_password=hash_password("Manager123!"),
        is_active=True,
    )
    await u.insert()
    return u


@pytest.fixture
def manager_headers(manager_user: UserModel) -> dict:
    token = create_access_token(manager_user)
    return {
        "Authorization": f"Bearer {token}",
        "X-Tenant-Path": manager_user.tenant_path,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. Tamper Alert Pipeline Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_tamper_attempt_mutation_endpoint(manager_headers, manager_user):
    """Verifies that an attempt to mutate an immutable record creates critical audit logs & alerts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/audit-ledger/attempt-tamper-mutation",
            headers=manager_headers,
            json={
                "mine_site_id": str(uuid.uuid4()),
                "target_model": "TelemetryGasModel",
                "entity_id": str(uuid.uuid4()),
                "target_field": "ch4_percentage",
                "old_value": "1.25%",
                "new_value": "0.40%",
                "manager_name": "P. Ramesh",
            },
        )
        assert resp.status_code == 403
        data = resp.json()["detail"]
        assert data["error"] == "UNAUTHORIZED_MODIFICATION_ATTEMPT"
        assert "incident" in data

    # Verify audit block was committed
    tamper_logs = await AuditLedgerModel.find(
        AuditLedgerModel.entity_type == AuditEntityType.STATUTORY_RECORD_TAMPER_ATTEMPT.value
    ).to_list()
    assert len(tamper_logs) >= 1
    assert tamper_logs[0].payload.get("target_model") == "TelemetryGasModel"

    # Verify high-priority CRITICAL alerts were generated for both Ministry and DGMS
    alerts = await NotificationModel.find(
        NotificationModel.category == "STATUTORY_RECORD_TAMPER_ATTEMPT"
    ).to_list()
    assert len(alerts) >= 2
    roles_targeted = {a.recipient_role for a in alerts}
    assert UserRole.MINISTRY_AUDITOR.value in roles_targeted
    assert UserRole.DGMS_INSPECTOR.value in roles_targeted


# ─────────────────────────────────────────────────────────────────────────────
# 2. Data Logs API Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_atmospheric_logs_endpoint(manager_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/logs/atmospheric", headers=manager_headers)
        assert resp.status_code == 200
        logs = resp.json()
        assert len(logs) > 0
        first = logs[0]
        assert "ch4_pct" in first
        assert "co_ppm" in first
        assert "record_hash" in first
        assert first["is_immutable"] is True


@pytest.mark.asyncio
async def test_worker_muster_logs_endpoint(manager_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/logs/workers", headers=manager_headers)
        assert resp.status_code == 200
        logs = resp.json()
        assert len(logs) > 0
        first = logs[0]
        assert "worker_name" in first
        assert "is_overtime" in first
        assert "record_hash" in first


@pytest.mark.asyncio
async def test_mine_cast_logs_endpoint(manager_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/logs/mine-casts", headers=manager_headers)
        assert resp.status_code == 200
        logs = resp.json()
        assert len(logs) > 0
        first = logs[0]
        assert "bench_name" in first
        assert "extraction_tonnage" in first
        assert "quota_achievement_pct" in first
        assert "record_hash" in first


@pytest.mark.asyncio
async def test_atmospheric_log_modification_forbidden(manager_headers):
    """Direct modification of an atmospheric log must be intercepted with 403."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.put(
            f"/api/v1/logs/atmospheric/{uuid.uuid4()}",
            headers=manager_headers,
            json={
                "target_field": "ch4_percentage",
                "new_value": 0.20,
                "mine_site_id": str(uuid.uuid4()),
            },
        )
        assert resp.status_code == 403
        data = resp.json()["detail"]
        assert data["error"] == "UNAUTHORIZED_MODIFICATION_ATTEMPT"
        assert "incident" in data


# ─────────────────────────────────────────────────────────────────────────────
# 3. Manager-to-Ministry Memo Escalation Tests
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_manager_to_ministry_escalation_memo(manager_headers, manager_user):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/escalations/manager-to-ministry",
            headers=manager_headers,
            json={
                "mine_site_id": str(uuid.uuid4()),
                "subject": "Urgent Statutory Memo: Methane Excursion Seam 3A",
                "category": "SAFETY_BREACH",
                "priority": "URGENT",
                "message_body": "Continuous methane build-up detected near longwall face 3A. Evacuation protocol initiated.",
                "attach_telemetry_snapshot": True,
            },
        )
        assert resp.status_code == 201
        res = resp.json()
        assert res["status"] == "DISPATCHED_AND_LOGGED"
        assert res["sender_role"] == UserRole.COLLIERY_MANAGER.value
        assert "audit_block_hash" in res

    # Verify audit ledger block was written
    memos = await AuditLedgerModel.find(
        AuditLedgerModel.entity_type == AuditEntityType.MANAGER_MINISTRY_COMMUNICATION.value
    ).to_list()
    assert len(memos) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# 4. Predictive AI Forecaster Domain & Route Tests
# ─────────────────────────────────────────────────────────────────────────────
def test_predictive_safety_forecaster_domain():
    forecaster = PredictiveSafetyForecaster()
    forecast = forecaster.forecast_72h(historical_vectors=[])

    assert "timeline_series" in forecast
    assert "day_forecasts" in forecast
    assert len(forecast["day_forecasts"]) == 3

    # Check Day 1 (+24h), Day 2 (+48h), Day 3 (+72h)
    day1 = forecast["day_forecasts"][0]
    assert day1["day"] == 1
    assert day1["target_hours"] == 24
    assert "predicted_risk_score" in day1
    assert "confidence_interval_95" in day1
    assert len(day1["confidence_interval_95"]) == 2
    assert "predicted_ch4_pct" in day1

    # Check timeline series
    assert len(forecast["timeline_series"]) > 10


@pytest.mark.asyncio
async def test_risk_forecast_api_endpoint(manager_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/risk/forecast", headers=manager_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "day_forecasts" in data
        assert len(data["day_forecasts"]) == 3
        assert "timeline_series" in data
        assert "forecast_warnings" in data


@pytest.mark.asyncio
async def test_risk_current_includes_forecast(manager_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/risk/current", headers=manager_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "predictive_forecast_72h" in data
        assert "day_forecasts" in data["predictive_forecast_72h"]
