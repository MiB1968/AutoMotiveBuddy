from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_version: str = "v1"
    environment: str = "dev"
    app_name: str = "AutoMotive Buddy API"
    JWT_SECRET_KEY: str = "SUPER_SECRET_JWT_KEY"

settings = Settings()
