"""
Central application configuration.

All values are loaded from environment variables (see .env.example).
Never hardcode secrets here — this file only defines defaults and types.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "DataLens AI"
    DEBUG: bool = False

    DATABASE_URL: str = "mysql+pymysql://user:password@localhost:3306/datalens_ai"

    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 100

    FRONTEND_URL: str = "http://localhost:5173"


settings = Settings()
