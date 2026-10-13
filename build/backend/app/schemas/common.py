"""Common Pydantic models for Atlas backend.

Includes base health/readiness schemas, pagination metadata, and standard error envelopes.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    """Base model for Atlas API responses and requests with strict serialization configs."""
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class LivenessResponse(APIModel):
    """Process liveness probe response."""
    status: str = Field(default="ok", description="Process liveness state ('ok')")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the probe response",
    )


class ComponentStatus(APIModel):
    """Status of an individual backend component or dependency."""
    status: str = Field(..., description="Component state, e.g. 'ok', 'degraded', 'pending', 'down'")
    details: Optional[str] = Field(None, description="Human-readable detail or reason")


class ReadinessResponse(APIModel):
    """Application readiness probe response."""
    status: str = Field(..., description="Readiness status ('ready', 'not_ready')")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the probe response",
    )
    checks: Dict[str, ComponentStatus] = Field(
        default_factory=dict,
        description="Map of subcomponent readiness checks",
    )


class ErrorDetail(APIModel):
    """Standardized error envelope payload."""
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable explanation of the error")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional context or validation details")


class ErrorResponse(APIModel):
    """Standard error response envelope."""
    error: ErrorDetail


class PaginationMeta(APIModel):
    """Standard pagination metadata for list responses."""
    page: int = Field(..., ge=1, description="Current page number (1-based)")
    page_size: int = Field(..., ge=1, le=100, description="Items per page")
    total_items: int = Field(..., ge=0, description="Total number of items matching filter")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
