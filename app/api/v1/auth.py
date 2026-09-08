"""Auth router — login, refresh, logout."""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.dependencies import CurrentUser, get_user_repo
from app.infrastructure.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    role:          str
    tenant_path:   str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login", response_model=LoginResponse)
async def login(
    body:      LoginRequest,
    user_repo: UserRepository = Depends(get_user_repo),
):
    svc = AuthService(user_repo)
    try:
        access_token, refresh_token, user = await svc.login(body.email, body.password)
    except PermissionError:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return LoginResponse(
        access_token  = access_token,
        refresh_token = refresh_token,
        role          = user.role,
        tenant_path   = str(user.tenant_path),
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh(
    body:      RefreshRequest,
    user_repo: UserRepository = Depends(get_user_repo),
):
    svc = AuthService(user_repo)
    try:
        access_token, refresh_token = await svc.refresh(body.refresh_token)
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    # Fetch user for role/path
    from app.services.auth_service import decode_access_token
    claims = decode_access_token(access_token)
    return LoginResponse(
        access_token  = access_token,
        refresh_token = refresh_token,
        role          = claims["role"],
        tenant_path   = claims["tenant_path"],
    )


@router.post("/logout", status_code=204)
async def logout(
    body:      RefreshRequest,
    user_repo: UserRepository = Depends(get_user_repo),
):
    svc = AuthService(user_repo)
    await svc.logout(body.refresh_token)


@router.post("/logout-all", status_code=204)
async def logout_all(
    user:      CurrentUser,
    user_repo: UserRepository = Depends(get_user_repo),
):
    svc = AuthService(user_repo)
    await svc.logout_all(UUID(user["user_id"]))
