"""FastAPI main application entry point for Atlas Backend."""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_v1_router
from app.api.v1 import health
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import get_logger, setup_logging

settings = get_settings()
setup_logging(log_level=settings.LOG_LEVEL)
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    logger.info(
        "Atlas backend starting up: env=%s, version=%s",
        settings.ENVIRONMENT,
        settings.VERSION,
    )
    yield
    logger.info("Atlas backend shutting down")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Atlas Backend: Production-oriented REST API for GitLab CI/CD "
            "monitoring, build tracking, stable baseline promotion, and release management."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS - restricted strictly to configured origins
    cors_origins = [str(origin).rstrip("/") for origin in settings.CORS_ORIGINS]
    logger.info("Configured CORS allowed origins: %s", cors_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Register centralized exception handlers
    register_exception_handlers(app)

    # Mount API v1 router: e.g. /api/v1/health/live
    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    # Mount health router at root for standard orchestrator probes: /health/live, /health/ready
    app.include_router(health.router)

    @app.get("/", tags=["root"], summary="Atlas service root")
    async def root():
        """Root endpoint returning basic metadata and docs link."""
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR,
        }

    return app


app = create_application()
