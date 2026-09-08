"""
Pytest configuration and shared fixtures for MongoDB + Beanie ODM.
Uses mongomock_motor for fast, isolated, in-memory async testing.
"""
import asyncio
import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

from app.infrastructure.database.models import (
    AuditLedgerModel,
    ComplianceAlertModel,
    ComplianceScheduleModel,
    InspectionModel,
    MineSiteModel,
    MineUndergroundStationModel,
    StatutoryRuleModel,
    SyncConflictLogModel,
    TenantModel,
    UserModel,
    UserRefreshTokenModel,
    ViolationCAPAModel,
    document_models,
)
from app.services.auth_service import hash_password


# ── MongoDB + Beanie Mock DB Setup ───────────────────────────────────────────
@pytest_asyncio.fixture(autouse=True)
async def init_mock_db():
    """Initializes in-memory mock MongoDB with Beanie before each test."""
    client = AsyncMongoMockClient()
    db = client.get_database("test_coal_governance")
    orig_list_colls = db.list_collection_names

    async def patched_list_colls(*args, **kwargs):
        return await orig_list_colls()

    db.list_collection_names = patched_list_colls
    await init_beanie(database=db, document_models=document_models)
    
    # Mock Redis client as well to avoid needing external Redis instance
    fake_redis = AsyncMock()
    fake_redis.setex = AsyncMock(return_value=True)
    fake_redis.get = AsyncMock(return_value=None)
    fake_redis.delete = AsyncMock(return_value=1)
    fake_redis.keys = AsyncMock(return_value=[])
    fake_redis.ping = AsyncMock(return_value=True)

    with patch("app.infrastructure.cache.redis_client.get_redis", return_value=fake_redis), \
         patch("app.infrastructure.cache.redis_client.close_redis", AsyncMock()):
        yield db


# Compatibility fixture for tests that declare db_session argument
@pytest.fixture
def db_session():
    """Compatibility fixture for MongoDB/Beanie tests."""
    return None


# ── Domain Object Model Fixtures ─────────────────────────────────────────────
@pytest_asyncio.fixture
async def ministry_tenant() -> TenantModel:
    t = TenantModel(
        id=uuid.uuid4(),
        name="Ministry of Coal",
        tier="MINISTRY",
        path="MOC",
        parent_path=None,
        parent_id=None,
    )
    await t.insert()
    return t


@pytest_asyncio.fixture
async def mine_site(ministry_tenant) -> MineSiteModel:
    m = MineSiteModel(
        id=uuid.uuid4(),
        tenant_id=ministry_tenant.id,
        name="Test Mine",
        lease_number="ML-TEST-001",
        district="Korba",
        state="Chhattisgarh",
        is_active=True,
    )
    await m.insert()
    return m


@pytest_asyncio.fixture
async def mine_site_with_boundary(ministry_tenant) -> MineSiteModel:
    """Mine site with standard GeoJSON Polygon boundary for $geoIntersects queries."""
    m = MineSiteModel(
        id=uuid.uuid4(),
        tenant_id=ministry_tenant.id,
        name="Boundary Test Mine",
        lease_number="ML-BOUNDARY-001",
        district="Korba",
        state="Chhattisgarh",
        is_active=True,
        boundary={
            "type": "Polygon",
            "coordinates": [
                [
                    [82.0, 21.0],
                    [82.0, 22.0],
                    [83.0, 22.0],
                    [83.0, 21.0],
                    [82.0, 21.0],
                ]
            ],
        },
    )
    await m.insert()
    return m


@pytest_asyncio.fixture
async def inspector_user(ministry_tenant) -> UserModel:
    u = UserModel(
        id=uuid.uuid4(),
        tenant_id=ministry_tenant.id,
        tenant_path="MOC",
        email="inspector@coal.gov.in",
        full_name="Test Inspector",
        role="DGMS_INSPECTOR",
        hashed_password=hash_password("TestPass123!"),
        is_active=True,
    )
    await u.insert()
    return u


@pytest_asyncio.fixture
async def underground_station(mine_site) -> MineUndergroundStationModel:
    s = MineUndergroundStationModel(
        id=uuid.uuid4(),
        mine_site_id=mine_site.id,
        station_code="LEVEL3-PANEL7",
        depth_meters=350.0,
        is_active=True,
    )
    await s.insert()
    return s


@pytest_asyncio.fixture
async def statutory_rule() -> StatutoryRuleModel:
    r = StatutoryRuleModel(
        id=uuid.uuid4(),
        rule_code="DGMS-2024-001",
        title="Ventilation Safety",
        regulatory_body="DGMS",
        category="VentilationSafety",
        description="Test rule",
        is_active=True,
        effective_from=date(2024, 1, 1),
    )
    await r.insert()
    return r
