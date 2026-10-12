from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import JobModel, PipelineModel, ProjectModel


def utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


PROJECTS = [
    {
        "id": "atlas-api", "name": "Atlas API", "path": "atlas-platform/atlas-api",
        "product": "Core Cloud Platform", "release_stream": "v2.8-mainline",
        "solution_type": "REST & GraphQL Microservice", "infrastructure_type": "AWS EKS (Kubernetes 1.30)",
        "deployment_type": "Blue-Green Deployment", "default_branch": "main",
        "description": "High-throughput identity and routing gateway handling tenant session states.",
    },
    {
        "id": "nimbus-web", "name": "Nimbus Web", "path": "nimbus-core/nimbus-web",
        "product": "Enterprise Web Portal", "release_stream": "v4.1-quarterly",
        "solution_type": "Next.js & Vite Client Suite", "infrastructure_type": "Cloudflare Pages & Edge Workers",
        "deployment_type": "Canary Rollout (10% -> 100%)", "default_branch": "main",
        "description": "Unified administrative frontend and telemetry inspection console.",
    },
    {
        "id": "orion-services", "name": "Orion Services", "path": "orion-mesh/orion-services",
        "product": "Event Broker Engine", "release_stream": "v1.14-stable-lts",
        "solution_type": "Kafka Event Consumer & CDC Processor", "infrastructure_type": "GCP GKE Autopilot",
        "deployment_type": "Rolling Update with Graceful Drain", "default_branch": "master",
        "description": "Asynchronous event stream processor for cross-datacenter telemetry normalization.",
    },
    {
        "id": "polaris-platform", "name": "Polaris Platform", "path": "polaris-cloud/polaris-platform",
        "product": "Data Pipeline Fabric", "release_stream": "v3.2-mainline",
        "solution_type": "Distributed Worker Orchestrator", "infrastructure_type": "Azure AKS + Spot Node Pools",
        "deployment_type": "Staged Blue-Green with Automated Rollback", "default_branch": "main",
        "description": "Batch execution engine responsible for compliance report generation and analytics aggregation.",
    },
    {
        "id": "vega-gateway", "name": "Vega Gateway", "path": "vega-system/vega-gateway",
        "product": "Edge Traffic Mesh", "release_stream": "v1.6-mainline",
        "solution_type": "Envoy-based Ingress Controller", "infrastructure_type": "Bare Metal Multi-Region Equinix",
        "deployment_type": "Canary Wave Deployment", "default_branch": "main",
        "description": "High-performance API traffic balancer with dynamic rate limiting and TLS termination.",
    },
    {
        "id": "nova-analytics", "name": "Nova Analytics", "path": "nova-data/nova-analytics",
        "product": "Observability Suite", "release_stream": "v2.0-mainline",
        "solution_type": "Vector Search & Timeseries Collector", "infrastructure_type": "ClickHouse + Kube Clustered",
        "deployment_type": "Rolling Pod Restart", "default_branch": "develop",
        "description": "Telemetry ingestion layer aggregating real-time spans, logs, and metrics.",
    },
]

PIPELINES = [
    {
        "id": 489224, "project_id": "atlas-api", "project_name": "Atlas API",
        "project_path": "atlas-platform/atlas-api", "ref": "main",
        "commit_sha": "9f2a71d80b67e3a241e57cc4358a43612cf8e710", "commit_short_sha": "9f2a71d8",
        "commit_title": "refactor(auth): migrate JWT token validation to JWKS cache store",
        "commit_author": "Elena Rostova", "status": "running", "source": "push",
        "user": {"id": 104, "name": "Elena Rostova", "username": "erostova"},
        "created_at": utc("2026-10-09T01:52:10Z"), "started_at": utc("2026-10-09T01:52:35Z"),
        "finished_at": None, "duration_seconds": None, "stage_count": 5, "job_count": 9,
        "failed_job_count": 0, "merge_request_id": 1422, "merge_request_iid": 1422, "coverage": "89.4%",
    },
    {
        "id": 489223, "project_id": "polaris-platform", "project_name": "Polaris Platform",
        "project_path": "polaris-cloud/polaris-platform", "ref": "feature/polaris-batch-v3",
        "commit_sha": "c4e82b79a1f26488d01bfa82947e62a03429dd11", "commit_short_sha": "c4e82b79",
        "commit_title": "feat(orchestrator): add parallel DAG chunking for batch telemetry partitions",
        "commit_author": "Marcus Chen", "status": "failed", "source": "merge_request_event",
        "user": {"id": 108, "name": "Marcus Chen", "username": "mchen"},
        "created_at": utc("2026-10-09T01:10:04Z"), "started_at": utc("2026-10-09T01:10:20Z"),
        "finished_at": utc("2026-10-09T01:18:42Z"), "duration_seconds": 502, "stage_count": 5,
        "job_count": 7, "failed_job_count": 1, "merge_request_id": 894, "merge_request_iid": 894,
        "coverage": "84.1%",
    },
    {
        "id": 489222, "project_id": "nimbus-web", "project_name": "Nimbus Web",
        "project_path": "nimbus-core/nimbus-web", "ref": "main",
        "commit_sha": "6b41d08e5a7fa19c28e4612349098bcad7134efa", "commit_short_sha": "6b41d08e",
        "commit_title": "chore(deps): bump vite to 8.3 and modernize asset tree shaking",
        "commit_author": "Sophia Lorenzen", "status": "success", "source": "push",
        "user": {"id": 112, "name": "Sophia Lorenzen", "username": "slorenzen"},
        "created_at": utc("2026-10-09T00:35:14Z"), "started_at": utc("2026-10-09T00:35:32Z"),
        "finished_at": utc("2026-10-09T00:41:50Z"), "duration_seconds": 378, "stage_count": 5,
        "job_count": 2, "failed_job_count": 0, "coverage": "92.3%",
    },
    {
        "id": 489221, "project_id": "vega-gateway", "project_name": "Vega Gateway",
        "project_path": "vega-system/vega-gateway", "ref": "fix/envoy-rate-limit",
        "commit_sha": "a718c392476b5091e847cbb650912df082104921", "commit_short_sha": "a718c392",
        "commit_title": "fix(rate-limit): prevent burst overflow on redis rediscovery reconnect",
        "commit_author": "Tariq Mansoor", "status": "failed", "source": "merge_request_event",
        "user": {"id": 119, "name": "Tariq Mansoor", "username": "tmansoor"},
        "created_at": utc("2026-10-08T22:45:00Z"), "started_at": utc("2026-10-08T22:45:18Z"),
        "finished_at": utc("2026-10-08T22:51:30Z"), "duration_seconds": 372, "stage_count": 5,
        "job_count": 1, "failed_job_count": 1, "merge_request_id": 412, "merge_request_iid": 412,
    },
]

JOBS = [
    {
        "id": 10891, "pipeline_id": 489224, "project_id": "atlas-api", "project_name": "Atlas API",
        "name": "install-dependencies", "stage": "prepare", "status": "success",
        "started_at": utc("2026-10-09T01:52:35Z"), "finished_at": utc("2026-10-09T01:53:20Z"),
        "duration_seconds": 45, "runner_name": "gitlab-runner-us-east-k8s-01",
        "runner_tags": ["k8s", "high-io", "linux"],
    },
    {
        "id": 10895, "pipeline_id": 489224, "project_id": "atlas-api", "project_name": "Atlas API",
        "name": "integration-jwks-cache", "stage": "test", "status": "running",
        "started_at": utc("2026-10-09T01:58:35Z"), "finished_at": None, "duration_seconds": None,
        "runner_name": "gitlab-runner-us-east-k8s-04", "runner_tags": ["k8s", "redis-testbed", "linux"],
    },
    {
        "id": 10882, "pipeline_id": 489223, "project_id": "polaris-platform", "project_name": "Polaris Platform",
        "name": "build-dag-orchestrator", "stage": "build", "status": "success",
        "started_at": utc("2026-10-09T01:11:10Z"), "finished_at": utc("2026-10-09T01:12:40Z"),
        "duration_seconds": 90, "runner_name": "runner-spot-eu-west-01", "runner_tags": ["linux", "spot"],
    },
    {
        "id": 10884, "pipeline_id": 489223, "project_id": "polaris-platform", "project_name": "Polaris Platform",
        "name": "integration-tests-distributed", "stage": "test", "status": "failed",
        "started_at": utc("2026-10-09T01:15:25Z"), "finished_at": utc("2026-10-09T01:18:42Z"),
        "duration_seconds": 197, "runner_name": "runner-spot-eu-west-03",
        "runner_tags": ["linux", "distributed-cluster"],
        "failure_message": "TestChunkPartitionRebalance: expected 128 partitions settled within 45s SLA, received timeout signal",
        "failure_exit_code": 137,
    },
    {
        "id": 10885, "pipeline_id": 489223, "project_id": "polaris-platform", "project_name": "Polaris Platform",
        "name": "security-container-scan", "stage": "security", "status": "skipped",
        "started_at": utc("2026-10-09T01:18:42Z"), "finished_at": utc("2026-10-09T01:18:42Z"),
        "duration_seconds": 0, "runner_tags": ["security"],
    },
    {
        "id": 10871, "pipeline_id": 489222, "project_id": "nimbus-web", "project_name": "Nimbus Web",
        "name": "pnpm-cache-restore", "stage": "prepare", "status": "success",
        "started_at": utc("2026-10-09T00:35:32Z"), "finished_at": utc("2026-10-09T00:36:12Z"),
        "duration_seconds": 40, "runner_name": "gitlab-runner-us-east-k8s-01", "runner_tags": ["node22", "k8s"],
    },
    {
        "id": 10872, "pipeline_id": 489222, "project_id": "nimbus-web", "project_name": "Nimbus Web",
        "name": "lint-eslint-prettier", "stage": "build", "status": "success",
        "started_at": utc("2026-10-09T00:36:15Z"), "finished_at": utc("2026-10-09T00:37:05Z"),
        "duration_seconds": 50, "runner_name": "gitlab-runner-us-east-k8s-01", "runner_tags": ["node22", "k8s"],
    },
    {
        "id": 10880, "pipeline_id": 489221, "project_id": "vega-gateway", "project_name": "Vega Gateway",
        "name": "envoy-rate-limit-tests", "stage": "test", "status": "failed",
        "started_at": utc("2026-10-08T22:47:00Z"), "finished_at": utc("2026-10-08T22:51:30Z"),
        "duration_seconds": 270, "failure_message": "Rate limit regression test failed",
        "failure_exit_code": 1,
    },
]


def seed_database(session: Session) -> None:
    if session.scalar(select(ProjectModel.id).limit(1)) is not None:
        return
    session.add_all(ProjectModel(**project) for project in PROJECTS)
    session.flush()
    session.add_all(PipelineModel(**pipeline) for pipeline in PIPELINES)
    session.flush()
    session.add_all(JobModel(**job) for job in JOBS)
    session.commit()
