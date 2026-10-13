"""Automated tests for health check, liveness, and readiness endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient) -> None:
    """Verify that root endpoint returns service info and 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Atlas"
    assert data["status"] == "online"
    assert "version" in data
    assert data["api_v1"] == "/api/v1"


def test_liveness_at_root(client: TestClient) -> None:
    """Verify process liveness probe at /health/live."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Atlas"
    assert "version" in data
    assert "timestamp" in data


def test_liveness_at_v1_prefix(client: TestClient) -> None:
    """Verify process liveness probe at /api/v1/health/live."""
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Atlas"
    assert "version" in data
    assert "timestamp" in data


def test_readiness_at_root(client: TestClient) -> None:
    """Verify application readiness probe at /health/ready."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["service"] == "Atlas"
    assert "checks" in data
    assert "app" in data["checks"]
    assert data["checks"]["app"]["status"] == "ok"
    assert "database" in data["checks"]


def test_readiness_at_v1_prefix(client: TestClient) -> None:
    """Verify application readiness probe at /api/v1/health/ready."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["service"] == "Atlas"
    assert "checks" in data


def test_cors_headers_allowed_origin(client: TestClient) -> None:
    """Verify CORS headers when request originates from configured frontend."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.get("/health/live", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_headers_disallowed_origin(client: TestClient) -> None:
    """Verify CORS blocks unconfigured origins."""
    headers = {
        "Origin": "https://malicious-external-site.example.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.get("/health/live", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") is None


def test_openapi_schema_accessible(client: TestClient) -> None:
    """Verify that OpenAPI documentation is generated and accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "Atlas"
    assert "/health/live" in schema["paths"]
    assert "/api/v1/health/live" in schema["paths"]


@pytest.mark.asyncio
async def test_async_liveness(async_client) -> None:
    """Verify async client interaction with liveness endpoint."""
    response = await async_client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
