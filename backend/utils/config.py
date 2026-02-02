"""Application configuration using Pydantic settings."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API metadata
    APP_NAME: str = "ETTJ API"
    API_VERSION: str = "1.0.0"
    LOG_LEVEL: str = "INFO"

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # CORS settings - allow all localhost ports for development
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:19000",
        "http://localhost:19006",
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:19000",
        "http://127.0.0.1:19006",
        "http://127.0.0.1:8081",
        "*",  # Allow all origins in development
    ]

    # Brazilian market constants
    business_days_per_year: int = 252
    max_term_years: int = 5
    max_term_days: int = 1260  # 5 years * 252 days

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
