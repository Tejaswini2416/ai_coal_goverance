"""
Database & Redis Connection Manager
Handles Motor MongoDB AsyncIOMotorClient, Beanie ODM initialization, and Redis connection pool verification.
"""
from typing import Optional, Dict, Any
import structlog
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import redis.asyncio as aioredis

from app.config import settings
from app.infrastructure.database.models import document_models
from app.infrastructure.database.seeds.telangana_mines import seed_telangana_mines_data

logger = structlog.get_logger(__name__)

# Global singletons
_mongo_client: Optional[AsyncIOMotorClient] = None
_redis_pool: Optional[aioredis.Redis] = None


async def get_mongo_client() -> AsyncIOMotorClient:
    """Returns or creates the active Motor client instance."""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=2000,
        )
    return _mongo_client


async def init_beanie_db(database_name: str = "coal_governance", seed_if_empty: bool = True) -> Dict[str, Any]:
    """
    Initializes Beanie ODM with all 15 statutory document models.
    Supports in-memory mongomock fallback for local development if MongoDB is offline.
    """
    global _mongo_client
    logger.info("Initializing Beanie ODM with MongoDB", url=settings.MONGODB_URL)

    try:
        client = await get_mongo_client()
        await client.admin.command("ping")
        db = client[database_name]
        await init_beanie(database=db, document_models=document_models)
        logger.info("MongoDB connection established and Beanie ODM initialized", database=database_name)
        mode = "live_mongodb"
    except Exception as exc:
        if settings.APP_ENV == "development":
            logger.warning(
                "Local MongoDB not reachable on 27017. Falling back to in-memory mongomock for development.",
                error=str(exc),
            )
            from mongomock_motor import AsyncMongoMockClient
            mock_client = AsyncMongoMockClient()
            db = mock_client.get_database(database_name)
            
            # Patch list_collection_names for mongomock
            orig_list_colls = db.list_collection_names
            async def patched_list_colls(*args, **kwargs):
                return await orig_list_colls()
            db.list_collection_names = patched_list_colls
            
            await init_beanie(database=db, document_models=document_models)
            _mongo_client = mock_client
            mode = "mock_in_memory"
        else:
            raise exc

    if seed_if_empty:
        await seed_telangana_mines_data(force_reseed=False)

    return {"status": "connected", "mode": mode, "database": database_name}


async def get_redis_client() -> aioredis.Redis:
    """Returns or creates the active aioredis client."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=2.0,
        )
    return _redis_pool


async def check_redis_connection() -> Dict[str, Any]:
    """Tests live Redis connectivity."""
    try:
        r = await get_redis_client()
        pong = await r.ping()
        info = await r.info("server")
        return {
            "status": "connected",
            "ping": pong,
            "version": info.get("redis_version", "unknown"),
            "url": settings.REDIS_URL,
        }
    except Exception as exc:
        logger.warning("Redis connection check failed", error=str(exc), url=settings.REDIS_URL)
        return {
            "status": "disconnected",
            "error": str(exc),
            "url": settings.REDIS_URL,
        }


async def close_db_connections() -> None:
    """Gracefully closes all open database and Redis connection pools."""
    global _mongo_client, _redis_pool
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
    if _redis_pool:
        await _redis_pool.close()
        _redis_pool = None
    logger.info("Closed MongoDB and Redis connection pools.")
