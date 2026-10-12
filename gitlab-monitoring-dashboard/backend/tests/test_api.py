from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from types import SimpleNamespace

from backend.app.db import build_engine
from backend.app.main import create_app
from backend.app.models import PipelineModel, ProjectModel
from backend.app.repository import sort_pipelines, stage_status
from backend.app.models import JobModel


def client(tmp_path):
    return TestClient(create_app(f"sqlite:///{tmp_path / 'test.db'}"))


def test_health_response(tmp_path):
    response = client(tmp_path).get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_pipeline_listing_and_filters(tmp_path):
    api = client(tmp_path)
    search_cases = {
        "489224": 489224,
        "Atlas API": 489224,
        "JWKS": 489224,
        "Elena Rostova": 489224,
        "feature/polaris": 489223,
        "c4e82b79a1f26488d01bfa82947e62a03429dd11": 489223,
    }
    for term, expected_id in search_cases.items():
        response = api.get("/api/v1/pipelines", params={"search": term})
        assert response.status_code == 200
        assert [item["id"] for item in response.json()["items"]] == [expected_id]

    assert api.get("/api/v1/pipelines", params={"project": "polaris-platform"}).json()["pagination"]["totalItems"] == 1
    assert api.get("/api/v1/pipelines", params={"project": "all"}).json()["pagination"]["totalItems"] == 4
    assert api.get("/api/v1/pipelines", params={"ref": "main"}).json()["pagination"]["totalItems"] == 2
    assert api.get("/api/v1/pipelines", params={"ref": "all"}).json()["pagination"]["totalItems"] == 4
    assert api.get("/api/v1/pipelines", params={"status": "failed"}).json()["pagination"]["totalItems"] == 2
    assert api.get("/api/v1/pipelines", params={"status": "all"}).json()["pagination"]["totalItems"] == 4
    assert api.get("/api/v1/pipelines", params={"ref": "main", "status": "success"}).json()["pagination"]["totalItems"] == 1


def test_stable_sorting_and_summary_ignore_pagination(tmp_path):
    response = client(tmp_path).get(
        "/api/v1/pipelines",
        params={"pageSize": 1, "sortBy": "id", "sortOrder": "asc"},
    )
    body = response.json()
    assert response.status_code == 200
    assert body["items"][0]["id"] == 489221
    assert body["pagination"] == {"page": 1, "pageSize": 1, "totalItems": 4, "totalPages": 4}
    assert body["summary"]["totalPipelines"] == 4
    assert body["summary"]["failed"] == 2


def test_duration_sorting_places_nulls_first_in_both_directions(tmp_path):
    api = client(tmp_path)
    ascending = api.get(
        "/api/v1/pipelines",
        params={"sortBy": "durationSeconds", "sortOrder": "asc"},
    ).json()["items"]
    descending = api.get(
        "/api/v1/pipelines",
        params={"sortBy": "durationSeconds", "sortOrder": "desc"},
    ).json()["items"]
    assert ascending[0]["id"] == 489224
    assert descending[0]["id"] == 489224
    assert [item["id"] for item in ascending[1:]] == [489221, 489222, 489223]
    assert [item["id"] for item in descending[1:]] == [489223, 489222, 489221]


def test_pagination_boundaries_and_empty_results(tmp_path):
    api = client(tmp_path)
    page_two = api.get("/api/v1/pipelines?page=2&pageSize=3")
    assert page_two.status_code == 200
    assert [item["id"] for item in page_two.json()["items"]] == [489221]
    assert page_two.json()["pagination"] == {
        "page": 2,
        "pageSize": 3,
        "totalItems": 4,
        "totalPages": 2,
    }

    beyond = api.get("/api/v1/pipelines?page=3&pageSize=3").json()
    assert beyond["items"] == []
    assert beyond["pagination"]["totalItems"] == 4

    empty = api.get("/api/v1/pipelines?search=does-not-exist").json()
    assert empty["items"] == []
    assert empty["pagination"] == {
        "page": 1,
        "pageSize": 25,
        "totalItems": 0,
        "totalPages": 0,
    }


def test_recent_records_follow_filtered_dataset_order(tmp_path):
    api = client(tmp_path)
    body = api.get("/api/v1/pipelines?status=failed&pageSize=1").json()
    assert [item["id"] for item in body["recentPipelines"]] == [489223, 489221]
    assert [item["pipeline"]["id"] for item in body["recentFailures"]] == [489223, 489221]
    assert body["summary"]["totalPipelines"] == 2


def test_pipeline_detail_has_ordered_stages_and_jobs(tmp_path):
    response = client(tmp_path).get("/api/v1/pipelines/489223")
    assert response.status_code == 200
    body = response.json()
    assert [stage["name"] for stage in body["stages"]] == ["build", "test", "security"]
    assert body["stages"][1]["jobs"][0]["failureMessage"]


def test_missing_pipeline_uses_error_envelope(tmp_path):
    response = client(tmp_path).get("/api/v1/pipelines/999999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "pipeline_not_found"

    invalid = client(tmp_path).get("/api/v1/pipelines/not-an-integer")
    assert invalid.status_code == 400
    assert invalid.json()["error"]["code"] == "validation_error"


def test_projects_include_stats_and_empty_projects(tmp_path):
    response = client(tmp_path).get("/api/v1/projects")
    assert response.status_code == 200
    items = {item["id"]: item for item in response.json()["items"]}
    assert items["atlas-api"]["stats"]["totalPipelines"] == 1
    assert items["orion-services"]["stats"]["totalPipelines"] == 0
    assert items["orion-services"]["stats"]["latestPipeline"] is None

    without_stats = client(tmp_path).get("/api/v1/projects?includeStats=false").json()
    assert all(item["stats"] is None for item in without_stats["items"])


def test_unfinished_pipeline_has_null_duration(tmp_path):
    response = client(tmp_path).get("/api/v1/pipelines/489224")
    assert response.status_code == 200
    body = response.json()
    assert body["finishedAt"] is None
    assert body["durationSeconds"] is None
    assert body["stages"][0]["jobs"][0]["durationSeconds"] == 45
    assert body["stages"][1]["jobs"][0]["durationSeconds"] is None
    assert body["startedAt"].endswith("Z")
    assert body["stages"][0]["jobs"][0]["startedAt"].endswith("Z")


def test_invalid_query_parameters_use_error_envelope(tmp_path):
    api = client(tmp_path)
    response = api.get("/api/v1/pipelines?pageSize=0")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"

    response = api.get("/api/v1/pipelines?sortBy=unsupported")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"

    response = api.get("/api/v1/pipelines?sortOrder=sideways")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"

    response = api.get("/api/v1/pipelines?status=unknown")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"

    response = api.get("/api/v1/projects?includeStats=maybe")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_seed_initialization_is_idempotent_and_isolated(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'isolated.db'}"
    create_app(database_url)
    create_app(database_url)
    engine = build_engine(database_url)
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(ProjectModel)) == 6
        assert session.scalar(select(func.count()).select_from(PipelineModel)) == 4


def test_stage_status_precedence():
    def job(status):
        return JobModel(
            id=1,
            pipeline_id=1,
            project_id="p",
            project_name="P",
            name="job",
            stage="test",
            status=status,
            started_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            finished_at=None,
            duration_seconds=None,
        )

    assert stage_status([job("skipped")]) == "skipped"
    assert stage_status([job("success"), job("manual")]) == "manual"
    assert stage_status([job("canceled"), job("pending")]) == "canceled"
    assert stage_status([job("success"), job("skipped")]) == "success"
    assert stage_status([job("success"), job("pending")]) == "pending"
    assert stage_status([job("success"), job("running")]) == "running"
    assert stage_status([job("success"), job("failed")]) == "failed"


def test_equal_primary_sort_values_use_id_tie_breaker():
    records = [
        SimpleNamespace(id=2, started_at=datetime(2026, 1, 1, tzinfo=timezone.utc), duration_seconds=10),
        SimpleNamespace(id=1, started_at=datetime(2026, 1, 1, tzinfo=timezone.utc), duration_seconds=10),
    ]
    assert [item.id for item in sort_pipelines(records, "startedAt", "asc")] == [1, 2]
    assert [item.id for item in sort_pipelines(records, "startedAt", "desc")] == [2, 1]
