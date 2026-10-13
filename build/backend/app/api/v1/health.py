"""Health check endpoints for process liveness and dependency readiness."""

from fastapi import APIRouter, status
from app.core.config import get_settings
from app.schemas.common import ComponentStatus, LivenessResponse, ReadinessResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health/live",
    response_model=LivenessResponse,
    status_code=status.HTTP_200_OK,
    summary="Process liveness probe",
    description="Returns 200 OK if the backend process is running and responding to requests.",
)
async def get_liveness() -> LivenessResponse:
    """Liveness probe. Never requires external dependencies (such as PostgreSQL) to be healthy."""
    settings = get_settings()
    return LivenessResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
    )


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    status_code=status.HTTP_200_OK,
    summary="Application readiness probe",
    description="Returns readiness state of the application and its critical dependencies.",
)
async def get_readiness() -> ReadinessResponse:
    """Readiness probe. Checks external dependencies.
    
    In Milestone 1, database connectivity is not yet active (scheduled for Milestone 2),
    so this reflects application initialization readiness.
    """
    settings = get_settings()
    
    # In Milestone 1, report app readiness and note DB integration planned for Milestone 2
    checks = {
        "app": ComponentStatus(status="ok", details="FastAPI application initialized"),
        "database": ComponentStatus(
            status="pending",
            details="PostgreSQL connection scheduled for Milestone 2",
        ),
    }

    return ReadinessResponse(
        status="ready",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        checks=checks,
    )
