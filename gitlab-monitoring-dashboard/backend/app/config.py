from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
       "sqlite:///./dashboard.db",
    )
    service_name: str = "gitlab-monitoring-api"
    version: str = "1.0.0"


settings = Settings()
