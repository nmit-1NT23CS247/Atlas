from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base, UTCDateTime


class ProjectModel(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    path: Mapped[str] = mapped_column(String(300), nullable=False)
    product: Mapped[str] = mapped_column(String(200), nullable=False)
    release_stream: Mapped[str] = mapped_column(String(200), nullable=False)
    solution_type: Mapped[str] = mapped_column(String(200), nullable=False)
    infrastructure_type: Mapped[str] = mapped_column(String(200), nullable=False)
    deployment_type: Mapped[str] = mapped_column(String(200), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    pipelines: Mapped[list["PipelineModel"]] = relationship(back_populates="project")


class PipelineModel(Base):
    __tablename__ = "pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    project_name: Mapped[str] = mapped_column(String(200), nullable=False)
    project_path: Mapped[str] = mapped_column(String(300), nullable=False)
    ref: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    commit_sha: Mapped[str] = mapped_column(String(64), nullable=False)
    commit_short_sha: Mapped[str] = mapped_column(String(16), nullable=False)
    commit_title: Mapped[str] = mapped_column(String(500), nullable=False)
    commit_author: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(40), nullable=False)
    user: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    started_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, index=True)
    finished_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    stage_count: Mapped[int] = mapped_column(Integer, nullable=False)
    job_count: Mapped[int] = mapped_column(Integer, nullable=False)
    failed_job_count: Mapped[int] = mapped_column(Integer, nullable=False)
    web_url: Mapped[str | None] = mapped_column(String(1000))
    merge_request_id: Mapped[int | None] = mapped_column(Integer)
    merge_request_iid: Mapped[int | None] = mapped_column(Integer)
    coverage: Mapped[str | None] = mapped_column(String(30))

    project: Mapped[ProjectModel] = relationship(back_populates="pipelines")
    jobs: Mapped[list["JobModel"]] = relationship(
        back_populates="pipeline",
        cascade="all, delete-orphan",
    )


class JobModel(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("pipelines.id"), index=True)
    project_id: Mapped[str] = mapped_column(String(120), nullable=False)
    project_name: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    stage: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    started_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    runner_name: Mapped[str | None] = mapped_column(String(300))
    runner_tags: Mapped[list[str] | None] = mapped_column(JSON)
    failure_message: Mapped[str | None] = mapped_column(String(2000))
    failure_exit_code: Mapped[int | None] = mapped_column(Integer)
    allow_failure: Mapped[bool | None] = mapped_column(Boolean)
    web_url: Mapped[str | None] = mapped_column(String(1000))

    pipeline: Mapped[PipelineModel] = relationship(back_populates="jobs")
