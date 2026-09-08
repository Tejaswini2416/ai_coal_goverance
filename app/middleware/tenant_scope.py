"""
Tenant Scope Middleware — Refinement 1.
Decodes JWT and attaches tenant_path (ltree string) and role to request.state.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.auth_service import decode_access_token

# Paths that don't require Bearer token authentication in middleware
_PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
    "/api/v1/attendance/export",
    "/api/v1/escalations/test-sms",
}


class TenantScopeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization", "")

        # Skip mandatory auth for public paths
        if request.url.path in _PUBLIC_PATHS or request.url.path.startswith("/api/v1/attendance/export"):
            if auth_header.startswith("Bearer "):
                token = auth_header.removeprefix("Bearer ").strip()
                try:
                    payload = decode_access_token(token)
                    request.state.user_id      = payload["sub"]
                    request.state.email        = payload["email"]
                    request.state.role         = payload["role"]
                    request.state.tenant_id    = payload["tenant_id"]
                    request.state.tenant_path  = payload["tenant_path"]
                except Exception:
                    pass
            return await call_next(request)

        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or malformed Authorization header."},
            )

        token = auth_header.removeprefix("Bearer ").strip()
        try:
            payload = decode_access_token(token)
        except ValueError as e:
            return JSONResponse(status_code=401, content={"detail": str(e)})

        # Attach to request.state — available in all downstream handlers
        request.state.user_id      = payload["sub"]
        request.state.email        = payload["email"]
        request.state.role         = payload["role"]
        request.state.tenant_id    = payload["tenant_id"]
        request.state.tenant_path  = payload["tenant_path"]   # ltree path string (Refinement 1)

        return await call_next(request)
