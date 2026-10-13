"""Application configuration loaded from environment variables using Pydantic Settings."""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application Metadata
    app_name: str = Field(default="Atlas", description="Application name")
    app_version: str = Field(default="0.1.0", description="API semantic version")
    environment: str = Field(default="development", description="Runtime environment: development, staging, production")
    debug: bool = Field(default=False, description="Enable debug mode")

    # Network & Server
    host: str = Field(default="0.0.0.0", description="Bind host")
    port: int = Field(default=8000, description="Bind port")
    api_v1_prefix: str = Field(default="/api/v1", description="URL prefix for version 1 endpoints")

    # Security & CORS (Restricted to local Atlas frontend origin in development)
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins",
    )

    # Database Configuration (PostgreSQL with psycopg 3 driver)
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/atlas",
        description="SQLAlchemy database connection string",
    )
    database_pool_size: int = Field(default=5, description="Connection pool size")
    database_max_overflow: int = Field(default=10, description="Max overflow connections")
    database_pool_timeout: int = Field(default=30, description="Connection pool timeout in seconds")

    # Logging
    log_level: str = Field(default="INFO", description="Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL")

    @property
    def PROJECT_NAME(self) -> str:
        """Alias for app_name."""
        return self.app_name

    @property
    def VERSION(self) -> str:
        """Alias for app_version."""
        return self.app_version

    @property
    def ENVIRONMENT(self) -> str:
        """Alias for environment."""
        return self.environment

    @property
    def API_V1_STR(self) -> str:
        """Alias for api_v1_prefix."""
        return self.api_v1_prefix

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Alias for cors_origins."""
        return self.cors_origins

    @property
    def DATABASE_URL(self) -> str:
        """Alias for database_url."""
        return self.database_url

    @property
    def LOG_LEVEL(self) -> str:
        """Alias for log_level."""
        return self.log_level


@lru_cache()
def get_settings() -> Settings:
    """Retrieve cached application settings instance."""
    return Settings()
