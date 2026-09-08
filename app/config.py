"""
Application Configuration — Pydantic BaseSettings.
All values are loaded from environment variables / .env file.
"""
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_ENV:        str  = "development"
    APP_SECRET_KEY: str  = "CHANGE_ME_32_CHAR_RANDOM_STRING_HERE"
    APP_DEBUG:      bool = False
    APP_LOG_LEVEL:  str  = "INFO"

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS:   int = 7
    JWT_ALGORITHM:                   str = "HS256"

    # ── Database ─────────────────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017/coal_governance"

    # ── External APIs ────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = "sk-test-dummy-key"
    ANTHROPIC_API_KEY: str = "sk-ant-test-dummy-key"
    # ── Redis / Celery ────────────────────────────────────────────────────────
    REDIS_URL:              str = "redis://localhost:6379/0"
    CELERY_BROKER_URL:      str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND:  str = "redis://localhost:6379/2"

    # ── MinIO / S3 ────────────────────────────────────────────────────────────
    MINIO_ENDPOINT:              str  = "localhost:9000"
    MINIO_ACCESS_KEY:            str  = "minioadmin"
    MINIO_SECRET_KEY:            str  = "minioadmin"
    MINIO_BUCKET_DOCUMENTS:      str  = "coal-documents"
    MINIO_BUCKET_EVIDENCE:       str  = "coal-evidence"
    MINIO_USE_SSL:               bool = False
    PRESIGNED_URL_EXPIRY_SECONDS: int = 3600

    # ── Compliance Monitor ────────────────────────────────────────────────────
    PERMIT_EXPIRY_ALERT_DAYS: str = "30,15,7,1"

    @property
    def alert_day_windows(self) -> list[int]:
        return [int(d.strip()) for d in self.PERMIT_EXPIRY_ALERT_DAYS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
