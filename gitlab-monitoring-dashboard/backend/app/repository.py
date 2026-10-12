from collections.abc import Sequence
from math import ceil

from sqlalchemy import Select, String, cast, select
from sqlalchemy.orm import Session, selectinload

from .models import JobModel, PipelineModel, ProjectModel
from .schemas import JobStatus, StageName

STAGE_ORDER = {name.value: index for index, name in enumerate(StageName)}
TERMINAL_PIPELINE_STATUSES = {"success", "failed", "canceled"}


def list_projects(session: Session) -> Sequence[ProjectModel]:
    return session.scalars(select(ProjectModel).order_by(ProjectModel.name)).all()


def base_pipeline_query() -> Select[tuple[PipelineModel]]:
    return select(PipelineModel).options(selectinload(PipelineModel.jobs))


def get_pipeline(session: Session, pipeline_id: int) -> PipelineModel | None:
    return session.scalar(base_pipeline_query().where(PipelineModel.id == pipeline_id))


def filtered_pipelines(
    session: Session,
    search: str | None,
    project: str | None,
    ref: str | None,
    status: str | None,
) -> list[PipelineModel]:
    query = base_pipeline_query()
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.where(
            (PipelineModel.project_name.ilike(term))
            | (PipelineModel.project_id.ilike(term))
            | (PipelineModel.commit_sha.ilike(term))
            | (PipelineModel.commit_title.ilike(term))
            | (PipelineModel.commit_author.ilike(term))
            | (PipelineModel.ref.ilike(term))
            | cast(PipelineModel.id, String).ilike(term)
        )
    if project and project != "all":
        query = query.where(PipelineModel.project_id == project)
    if ref and ref != "all":
        query = query.where(PipelineModel.ref == ref)
    if status and status != "all":
        query = query.where(PipelineModel.status == status)
    return list(session.scalars(query))


def sort_pipelines(items: list[PipelineModel], sort_by: str, sort_order: str) -> list[PipelineModel]:
    reverse = sort_order == "desc"

    def key(item: PipelineModel):
        value = item.started_at if sort_by == "startedAt" else item.id if sort_by == "id" else item.duration_seconds
        return (value, item.id)

    if sort_by == "durationSeconds":
        nulls = [item for item in items if item.duration_seconds is None]
        values = [item for item in items if item.duration_seconds is not None]
        return sorted(nulls, key=lambda item: item.id, reverse=reverse) + sorted(values, key=key, reverse=reverse)
    return sorted(items, key=key, reverse=reverse)


def stage_status(jobs: list[JobModel]) -> JobStatus:
    statuses = {job.status for job in jobs}
    if "failed" in statuses:
        return JobStatus.failed
    if "canceled" in statuses:
        return JobStatus.canceled
    if "running" in statuses:
        return JobStatus.running
    if "pending" in statuses:
        return JobStatus.pending
    if "manual" in statuses:
        return JobStatus.manual
    if statuses and statuses == {"skipped"}:
        return JobStatus.skipped
    return JobStatus.success


def stage_groups(pipeline: PipelineModel) -> list[tuple[str, list[JobModel]]]:
    groups: dict[str, list[JobModel]] = {}
    for job in pipeline.jobs:
        groups.setdefault(job.stage, []).append(job)
    return sorted(groups.items(), key=lambda pair: STAGE_ORDER.get(pair[0], 99))


def summary(items: list[PipelineModel]) -> dict:
    counts = {status: sum(item.status == status for item in items) for status in (
        "success", "failed", "running", "canceled", "pending", "skipped"
    )}
    completed = [item for item in items if item.finished_at is not None and item.status in TERMINAL_PIPELINE_STATUSES]
    durations = [item.duration_seconds for item in items if item.finished_at is not None and item.duration_seconds is not None and item.duration_seconds >= 0]
    return {
        "total_pipelines": len(items),
        "successful": counts["success"],
        "failed": counts["failed"],
        "running": counts["running"],
        "canceled": counts["canceled"],
        "pending": counts["pending"],
        "skipped": counts["skipped"],
        "success_rate": (counts["success"] / len(completed) * 100) if completed else 0,
        "avg_duration_seconds": round(sum(durations) / len(durations)) if durations else 0,
    }


def pagination(page: int, page_size: int, total: int) -> dict:
    return {"page": page, "page_size": page_size, "total_items": total, "total_pages": ceil(total / page_size) if total else 0}
