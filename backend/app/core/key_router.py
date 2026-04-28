import logging
from openai import AsyncOpenAI, RateLimitError, AuthenticationError, APIError
from app.core.key_manager import KeyManager
from app.core.key_limiter import KeyLimiter

logger = logging.getLogger("automotive-buddy-api")

class KeyRouter:
    def __init__(self, key_manager: KeyManager, key_limiter: KeyLimiter):
        self.key_manager = key_manager
        self.key_limiter = key_limiter

    async def ai_request(self, messages):
        for attempt in range(5):
            api_key = self.key_manager.get_next_key()
            if not api_key:
                logger.error("No API keys available")
                return None

            if self.key_limiter.is_rate_limited(api_key):
                continue
            
            client = AsyncOpenAI(api_key=api_key)
            try:
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages
                )
                self.key_limiter.record(api_key)
                return response.choices[0].message.content

            except RateLimitError:
                logger.warning(f"Rate limit hit for key: {api_key}")
                self.key_limiter.trigger_cooldown(api_key)
            except AuthenticationError:
                logger.error(f"Authentication error for key: {api_key}")
                self.key_manager.mark_invalid(api_key)
            except APIError as e:
                logger.error(f"API error: {e}")
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
        
        return None
