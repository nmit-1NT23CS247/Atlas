"""Main API router combining versioned endpoints."""

from fastapi import APIRouter
from app.api.v1 import health

api_v1_router = APIRouter()

# Register v1 routes
api_v1_router.include_router(health.router)
