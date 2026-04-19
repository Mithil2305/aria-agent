import time
from typing import Dict

from fastapi import HTTPException

from utils.cache import get_redis


_local_buckets: Dict[str, dict] = {}


async def enforce_rate_limit(
    scope: str,
    subject: str,
    limit: int = 30,
    window_seconds: int = 60,
) -> None:
    """Rate-limit requests per user and scope using Redis with memory fallback."""
    key = f"rl:{scope}:{subject}"
    redis_client = await get_redis()

    if redis_client is not None:
        try:
            count = await redis_client.incr(key)
            if count == 1:
                await redis_client.expire(key, window_seconds)
            if count > limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please retry shortly.",
                )
            return
        except HTTPException:
            raise
        except Exception:
            pass

    now = time.time()
    bucket = _local_buckets.get(key)
    if not bucket or bucket["reset_at"] <= now:
        _local_buckets[key] = {"count": 1, "reset_at": now + window_seconds}
        return

    bucket["count"] += 1
    if bucket["count"] > limit:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please retry shortly.",
        )
