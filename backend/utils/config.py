from pydantic import BaseSettings

class Settings(BaseSettings):
    api_version: str = "v1"
    environment: str = "dev"
    app_name: str = "AutoMotive Buddy API"

settings = Settings()
