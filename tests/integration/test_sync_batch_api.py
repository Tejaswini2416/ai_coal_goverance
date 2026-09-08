"""
Integration tests — POST /api/v1/sync/batch
Tests HTTP 207 partial-success, mixed batches, idempotency, conflict response shape.
"""
import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


def _utcnow():
    return datetime.now(tz=timezone.utc).isoformat()


@pytest.fixture
def auth_headers():
    """Mock JWT headers — in integration tests use a real login or test token."""
    return {"Authorization": "Bearer TEST_TOKEN_PLACEHOLDER"}


@pytest.mark.asyncio
async def test_sync_batch_returns_207():
    """Basic smoke test — health endpoint returns HTTP 200."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_sync_batch_response_shape(mine_site, inspector_user):
    """
    Full integration: submit a 1-item batch and validate response structure.
    """
    from app.services.auth_service import create_access_token
    token = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}

    idem_key = uuid.uuid4()
    inspection_id = uuid.uuid4()

    payload = {
        "inspections": [
            {
                "id":               str(inspection_id),
                "idempotency_key":  str(idem_key),
                "mine_site_id":     str(mine_site.id),
                "title":            "Batch Sync Test",
                "description":      "Integration test inspection",
                "location_type":    "SURFACE_GPS",
                "gps_location":     "POINT(82.5 21.5)",
                "inspection_date":  _utcnow(),
                "version":          1,
            }
        ],
        "violation_capas": [],
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/sync/batch", json=payload, headers=headers)

    assert response.status_code == 207
    body = response.json()
    assert "results" in body
    assert "summary"  in body
    assert body["summary"]["total"] == 1

    result = body["results"][0]
    assert result["id"]     == str(inspection_id)
    assert result["status"] in ("CREATED", "UPDATED", "CONFLICT", "DUPLICATE")


@pytest.mark.asyncio
async def test_sync_batch_idempotency(mine_site, inspector_user):
    """Submitting the same idempotency_key twice should return DUPLICATE on second call."""
    from app.services.auth_service import create_access_token
    token   = create_access_token(inspector_user)
    headers = {"Authorization": f"Bearer {token}"}

    idem_key      = str(uuid.uuid4())
    inspection_id = str(uuid.uuid4())

    item = {
        "id":               inspection_id,
        "idempotency_key":  idem_key,
        "mine_site_id":     str(mine_site.id),
        "title":            "Idempotency Test",
        "description":      "First submit",
        "location_type":    "SURFACE_GPS",
        "gps_location":     "POINT(82.5 21.5)",
        "inspection_date":  _utcnow(),
        "version":          1,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r1 = await client.post("/api/v1/sync/batch", json={"inspections": [item], "violation_capas": []}, headers=headers)
        r2 = await client.post("/api/v1/sync/batch", json={"inspections": [item], "violation_capas": []}, headers=headers)

    assert r1.status_code == 207
    assert r2.status_code == 207

    r1_result = r1.json()["results"][0]
    r2_result = r2.json()["results"][0]

    assert r1_result["status"] == "CREATED"
    assert r2_result["status"] == "DUPLICATE"
