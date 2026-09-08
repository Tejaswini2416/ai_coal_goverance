"""Redis async client — cache and pub/sub."""
import json
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

# Module-level singleton pool
_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _redis_pool


async def close_redis() -> None:
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None


# ── Helper wrappers ────────────────────────────────────────────────────────────
async def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    redis = await get_redis()
    await redis.setex(key, ttl_seconds, json.dumps(value, default=str))


async def cache_get(key: str) -> Any | None:
    redis = await get_redis()
    raw = await redis.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_delete(key: str) -> None:
    redis = await get_redis()
    await redis.delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    redis = await get_redis()
    keys = await redis.keys(pattern)
    if keys:
        await redis.delete(*keys)
