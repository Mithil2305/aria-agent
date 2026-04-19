import os
import time
from typing import Dict, Optional

try:
    import redis.asyncio as aioredis
except Exception:  # pragma: no cover - optional dependency
    aioredis = None


_redis = None
_store: Dict[str, dict] = {}


async def get_redis():
    global _redis
    if _redis is not None:
        return _redis
    if aioredis is None:
        return None

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        _redis = aioredis.from_url(redis_url, decode_responses=True)
        await _redis.ping()
        return _redis
    except Exception:
        _redis = None
        return None


async def get_cache(key: str) -> Optional[str]:
    redis_client = await get_redis()
    if redis_client is not None:
        try:
            return await redis_client.get(key)
        except Exception:
            pass

    entry = _store.get(key)
    if not entry:
        return None
    if entry["expires_at"] <= time.time():
        _store.pop(key, None)
        return None
    return entry["value"]


async def set_cache(key: str, value: str, ttl: int = 900) -> None:
    redis_client = await get_redis()
    if redis_client is not None:
        try:
            await redis_client.setex(key, ttl, value)
            return
        except Exception:
            pass

    _store[key] = {"value": value, "expires_at": time.time() + max(ttl, 1)}


async def delete_cache(key: str) -> None:
    redis_client = await get_redis()
    if redis_client is not None:
        try:
            await redis_client.delete(key)
            return
        except Exception:
            pass
    _store.pop(key, None)
