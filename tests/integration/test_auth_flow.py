"""
Integration tests — Auth flow (login, refresh, logout, revoked token).
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_login_returns_tokens(inspector_user):
    """Valid credentials should return access_token + refresh_token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email":    "inspector@coal.gov.in",
            "password": "TestPass123!",
        })
    assert response.status_code == 200
    body = response.json()
    assert "access_token"  in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"
    assert body["role"]        == "DGMS_INSPECTOR"
    assert "MOC" in body["tenant_path"]


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(inspector_user):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email":    "inspector@coal.gov.in",
            "password": "WrongPassword",
        })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(inspector_user):
    """Refresh token should rotate — old token revoked, new pair issued."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={
            "email":    "inspector@coal.gov.in",
            "password": "TestPass123!",
        })
        refresh_token = login.json()["refresh_token"]

        # Use refresh token
        r1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert r1.status_code == 200
        new_refresh = r1.json()["refresh_token"]
        assert new_refresh != refresh_token   # rotated

        # Old token should now be revoked
        r2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert r2.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_token(inspector_user):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={
            "email":    "inspector@coal.gov.in",
            "password": "TestPass123!",
        })
        refresh_token = login.json()["refresh_token"]

        logout = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
        assert logout.status_code == 204

        # Revoked token should now fail
        refresh = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert refresh.status_code == 401
