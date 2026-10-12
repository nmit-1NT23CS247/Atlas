from fastapi import Depends, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .db import Base, build_engine
from . import models  # noqa: F401
from .repository import (
    filtered_pipelines,
    get_pipeline,
    list_projects,
    pagination,
    sort_pipelines,
    stage_groups,
    stage_status,
    summary,
)
from .schemas import (
    ErrorResponse,
    HealthResponse,
    Job,
    Pipeline,
    PipelineDetail,
    PipelineListResponse,
    PipelineSummary,
    ProjectStats,
    ProjectWithStats,
    ProjectsResponse,
    RecentFailure,
    RecentPipeline,
    StageGroup,
)
from .seed import seed_database


def error_response(code: str, message: str, status_code: int, details=None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "requestId": None,
            }
        },
    )


def create_app(database_url: str | None = None) -> FastAPI:
    database_engine = build_engine(database_url)
    Base.metadata.create_all(database_engine)
    with Session(database_engine) as session:
        seed_database(session)

    def session_dependency():
        with Session(database_engine) as session:
            yield session

    app = FastAPI(title="GitLab Monitoring API", version=settings.version)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError):
        details = [
            {
                "field": ".".join(str(part) for part in error["loc"] if part != "query"),
                "reason": error["msg"],
            }
            for error in exc.errors()
        ]
        return error_response("validation_error", "One or more request parameters are invalid.", 400, details)

    @app.get("/api/v1/health", response_model=HealthResponse)
    def health():
        return {"status": "ok", "service": settings.service_name, "version": settings.version}

    @app.get(
        "/api/v1/pipelines",
        response_model=PipelineListResponse,
        response_model_by_alias=True,
    )
    def pipelines(
        search: str | None = None,
        project: str | None = None,
        ref: str | None = None,
        status: str | None = None,
        sort_by: str = Query("startedAt", alias="sortBy"),
        sort_order: str = Query("desc", alias="sortOrder"),
        page: int = Query(1, ge=1),
        page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
        session: Session = Depends(session_dependency),
    ):
        valid_sort = {"startedAt", "durationSeconds", "id"}
        valid_order = {"asc", "desc"}
        valid_status = {"success", "failed", "running", "canceled", "pending", "skipped", "all"}
        if sort_by not in valid_sort:
            return error_response("validation_error", "Invalid sortBy value.", 400, [{"field": "sortBy", "reason": "must be startedAt, durationSeconds, or id"}])
        if sort_order not in valid_order:
            return error_response("validation_error", "Invalid sortOrder value.", 400, [{"field": "sortOrder", "reason": "must be asc or desc"}])
        if status is not None and status not in valid_status:
            return error_response("validation_error", "Invalid status value.", 400, [{"field": "status", "reason": "must be a supported pipeline status"}])
        items = sort_pipelines(filtered_pipelines(session, search, project, ref, status), sort_by, sort_order)
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start:start + page_size]
        recent = sorted(items, key=lambda item: (item.started_at, item.id), reverse=True)[:5]
        failures = [item for item in sorted(items, key=lambda item: (item.started_at, item.id), reverse=True) if item.status == "failed"][:4]
        return {
            "items": [Pipeline.model_validate(item) for item in page_items],
            "summary": PipelineSummary.model_validate(summary(items)),
            "recent_pipelines": [recent_pipeline(item) for item in recent],
            "recent_failures": [
                RecentFailure(
                    pipeline=recent_pipeline(item),
                    failed_job=next((Job.model_validate(job) for job in item.jobs if job.status == "failed"), None),
                )
                for item in failures
            ],
            "pagination": pagination(page, page_size, total),
        }

    @app.get(
        "/api/v1/pipelines/{pipeline_id}",
        response_model=PipelineDetail | ErrorResponse,
        response_model_by_alias=True,
    )
    def pipeline_detail(pipeline_id: int, session: Session = Depends(session_dependency)):
        pipeline = get_pipeline(session, pipeline_id)
        if pipeline is None:
            return error_response("pipeline_not_found", f"Pipeline {pipeline_id} was not found.", 404)
        stages = []
        stage_orders = {"prepare": 0, "build": 1, "test": 2, "security": 3, "package": 4, "deploy": 5}
        for name, jobs in stage_groups(pipeline):
            durations = [job.duration_seconds for job in jobs if job.duration_seconds is not None and job.duration_seconds >= 0]
            stages.append(
                StageGroup(
                    name=name,
                    status=stage_status(jobs),
                    order=stage_orders.get(name, 99),
                    jobs=[Job.model_validate(job) for job in jobs],
                    total_jobs=len(jobs),
                    passed_jobs=sum(job.status == "success" for job in jobs),
                    failed_jobs=sum(job.status == "failed" for job in jobs),
                    duration_seconds=sum(durations),
                )
            )
        result = PipelineDetail(
            **Pipeline.model_validate(pipeline).model_dump(),
            stages=stages,
        )
        return result

    @app.get("/api/v1/projects", response_model=ProjectsResponse, response_model_by_alias=True)
    def projects(
        include_stats: bool = Query(True, alias="includeStats"),
        session: Session = Depends(session_dependency),
    ):
        output = []
        all_pipelines = list(session.query(models.PipelineModel).options(selectinload(models.PipelineModel.jobs)).all())
        for project in list_projects(session):
            project_pipelines = [item for item in all_pipelines if item.project_id == project.id]
            stats = project_stats(project_pipelines) if include_stats else None
            output.append(ProjectWithStats.model_validate({**project.__dict__, "stats": stats}))
        return {"items": output}

    return app


def recent_pipeline(item) -> RecentPipeline:
    return RecentPipeline(
        id=item.id,
        status=item.status,
        project_id=item.project_id,
        project_name=item.project_name,
        ref=item.ref,
        started_at=item.started_at,
        duration_seconds=item.duration_seconds,
    )


def project_stats(items) -> ProjectStats:
    completed = [item for item in items if item.finished_at is not None and item.status in {"success", "failed", "canceled"}]
    durations = [item.duration_seconds for item in items if item.finished_at is not None and item.duration_seconds is not None and item.duration_seconds >= 0]
    latest = max(items, key=lambda item: (item.started_at, item.id), default=None)
    return ProjectStats(
        total_pipelines=len(items),
        success_count=sum(item.status == "success" and item.finished_at is not None for item in items),
        failed_count=sum(item.status == "failed" for item in items),
        running_count=sum(item.status == "running" for item in items),
        success_rate=(sum(item.status == "success" for item in completed) / len(completed) * 100) if completed else 0,
        avg_duration_seconds=round(sum(durations) / len(durations)) if durations else 0,
        latest_pipeline=(
            {
                "id": latest.id,
                "status": latest.status,
                "started_at": latest.started_at,
                "ref": latest.ref,
            }
            if latest else None
        ),
    )


app = create_app()
