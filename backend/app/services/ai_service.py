import logging
from app.core.key_router import KeyRouter
from app.core.key_manager import KeyManager
from app.core.key_limiter import KeyLimiter
import os

logger = logging.getLogger("automotive-buddy-api")

# In production, keys should be loaded from secure storage or env
keys = os.getenv("OPENAI_KEYS", "").split(",")
key_manager = KeyManager(keys)
key_limiter = KeyLimiter()
key_router = KeyRouter(key_manager, key_limiter)

# Simple in-memory cache for now (production should use Redis)
_cache = {}

async def ask_ai(message: str):
    if message in _cache:
        logger.info(f"Cache hit for message: {message}")
        return _cache[message]
    
    logger.info(f"Cache miss for message: {message}, calling AI.")
    messages = [{"role": "user", "content": message}]
    result = await key_router.ai_request(messages)
    
    if result:
        _cache[message] = result
        
    return result
