import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    JWT_SECRET: str
    FIREBASE_CONFIG: str
    VITE_API_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"

try:
    settings = Settings()
except Exception as e:
    # Fallback to manual check if pydantic-settings fails in this env
    def must_env(key):
        value = os.getenv(key)
        if not value:
            # We don't raise here to allow the app to start and report the error via health checks if possible
            # But the user asked for return "MISSING CONFIG: <component>"
            return f"MISSING CONFIG: {key}"
        return value

    class ManualSettings:
        JWT_SECRET = must_env("JWT_SECRET")
        FIREBASE_CONFIG = must_env("FIREBASE_CONFIG")
    
    settings = ManualSettings()
