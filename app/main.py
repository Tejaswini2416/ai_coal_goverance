"""
FastAPI Application Factory
Coal Mines AI Governance & Compliance Monitoring System (SIH26024)
"""
# pyrefly: ignore [missing-import]
import structlog
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.infrastructure.cache.redis_client import close_redis, get_redis
from app.infrastructure.database.base import init_db, close_db
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.tenant_scope import TenantScopeMiddleware

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting Coal Mines Governance API", env=settings.APP_ENV)
    # Warm up Redis connection if available
    try:
        await get_redis()
        logger.info("Redis connection established")
    except Exception as exc:
        logger.warning("Redis is not reachable, caching will be bypassed or in-memory.", error=str(exc))

    await init_db()
    yield
    # Shutdown
    await close_redis()
    await close_db()
    logger.info("API shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title       = "Coal Mines AI Governance & Compliance Monitoring System",
        description = (
            "Enterprise-grade backend for AI-Based Smart Governance and Compliance "
            "Monitoring System for Coal Mines — Problem Statement SIH26024, Ministry of Coal."
        ),
        version     = "1.0.0",
        docs_url    = "/docs",
        redoc_url   = "/redoc",
        lifespan    = lifespan,
    )

    # ── Middleware (order matters — outermost first) ────────────────────────
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(TenantScopeMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins     = ["*"],    # Tighten in production
        allow_credentials = True,
        allow_methods     = ["*"],
        allow_headers     = ["*"],
    )

    # ── Routers ────────────────────────────────────────────────────────────
    from app.api.v1.router import v1_router
    app.include_router(v1_router, prefix="/api/v1")

    # ── Health Check ───────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "healthy", "version": "1.0.0", "env": settings.APP_ENV}

    # ── Global Exception Handler ────────────────────────────────────────────
    @app.exception_handler(PermissionError)
    async def permission_error_handler(request: Request, exc: PermissionError):
        return JSONResponse(status_code=403, content={"detail": str(exc)})

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    return app


app = create_app()
