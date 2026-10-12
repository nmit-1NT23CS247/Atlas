from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, field_serializer


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    @field_serializer("*", when_used="json")
    def serialize_utc_datetime(self, value: Any):
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        return value


class PipelineStatus(str, Enum):
    success = "success"
    failed = "failed"
    running = "running"
    canceled = "canceled"
    pending = "pending"
    skipped = "skipped"


class JobStatus(str, Enum):
    success = "success"
    failed = "failed"
    running = "running"
    canceled = "canceled"
    pending = "pending"
    skipped = "skipped"
    manual = "manual"


class StageName(str, Enum):
    prepare = "prepare"
    build = "build"
    test = "test"
    security = "security"
    package = "package"
    deploy = "deploy"


class PipelineSource(str, Enum):
    push = "push"
    merge_request_event = "merge_request_event"
    schedule = "schedule"
    web = "web"
    api = "api"
    trigger = "trigger"


class PipelineUser(ApiModel):
    id: int
    name: str
    username: str
    avatar_url: str | None = None


class Job(ApiModel):
    id: int
    pipeline_id: int
    project_id: str
    project_name: str
    name: str
    stage: StageName
    status: JobStatus
    started_at: datetime
    finished_at: datetime | None
    duration_seconds: int | None
    runner_name: str | None = None
    runner_tags: list[str] | None = None
    failure_message: str | None = None
    failure_exit_code: int | None = None
    allow_failure: bool | None = None
    web_url: str | None = None


class StageGroup(ApiModel):
    name: StageName
    status: JobStatus
    order: int
    jobs: list[Job]
    total_jobs: int
    passed_jobs: int
    failed_jobs: int
    duration_seconds: int


class Pipeline(ApiModel):
    id: int
    project_id: str
    project_name: str
    project_path: str
    ref: str
    commit_sha: str
    commit_short_sha: str
    commit_title: str
    commit_author: str
    status: PipelineStatus
    source: PipelineSource
    user: PipelineUser
    created_at: datetime
    started_at: datetime
    finished_at: datetime | None
    duration_seconds: int | None
    stage_count: int
    job_count: int
    failed_job_count: int
    web_url: str | None = None
    merge_request_id: int | None = None
    merge_request_iid: int | None = None
    coverage: str | None = None


class PipelineSummary(ApiModel):
    total_pipelines: int
    successful: int
    failed: int
    running: int
    canceled: int
    pending: int
    skipped: int
    success_rate: float
    avg_duration_seconds: int


class RecentPipeline(ApiModel):
    id: int
    status: PipelineStatus
    project_id: str
    project_name: str
    ref: str
    started_at: datetime
    duration_seconds: int | None


class RecentFailure(ApiModel):
    pipeline: RecentPipeline
    failed_job: Job | None = None


class Pagination(ApiModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PipelineListResponse(ApiModel):
    items: list[Pipeline]
    summary: PipelineSummary
    recent_pipelines: list[RecentPipeline]
    recent_failures: list[RecentFailure]
    pagination: Pagination


class PipelineDetail(Pipeline):
    stages: list[StageGroup]


class Project(ApiModel):
    id: str
    name: str
    path: str
    product: str
    release_stream: str
    solution_type: str
    infrastructure_type: str
    deployment_type: str
    default_branch: str
    description: str


class LatestPipeline(ApiModel):
    id: int
    status: PipelineStatus
    started_at: datetime
    ref: str


class ProjectStats(ApiModel):
    total_pipelines: int
    success_count: int
    failed_count: int
    running_count: int
    success_rate: float
    avg_duration_seconds: int
    latest_pipeline: LatestPipeline | None


class ProjectWithStats(Project):
    stats: ProjectStats | None = None


class ProjectsResponse(ApiModel):
    items: list[ProjectWithStats]


class HealthResponse(ApiModel):
    status: str
    service: str
    version: str


class ErrorDetail(ApiModel):
    field: str
    reason: str


class ErrorBody(ApiModel):
    code: str
    message: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class ErrorResponse(ApiModel):
    error: ErrorBody
