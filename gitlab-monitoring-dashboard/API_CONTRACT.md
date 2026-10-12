# GitLab Monitoring Dashboard API Contract

## 1. Purpose and scope

This document proposes the REST contract for replacing the frontend's
in-memory mock data with a FastAPI service backed by PostgreSQL. It describes
the interface the React frontend should call; it does not implement the API,
database, GitLab integration, authentication, polling, webhooks, or any other
backend behavior.

The backend will normalize internal records and, later, GitLab REST API
responses into these schemas. The frontend must call this backend rather than
GitLab directly. GitLab credentials, access tokens, and other secrets must
remain server-side.

## 2. Versioning and conventions

- Base path: `/api/v1`
- Content type: `application/json`
- All timestamps are ISO 8601 UTC strings with a `Z` suffix, for example
  `2026-10-09T01:18:42Z`.
- IDs are JSON numbers only where the current frontend uses numbers
  (`pipeline.id`, `job.id`, user IDs, and merge-request IDs). Project IDs are
  strings because the frontend uses values such as `atlas-api`.
- Durations are non-negative integer seconds. A duration is `null` when the
  execution is unfinished or no valid completed duration is available.
- Nullable fields are explicitly returned as `null`; omitted fields are
  reserved for optional fields whose value is not available.
- The API returns UTF-8 JSON and does not expose GitLab credentials or raw
  upstream responses.

## 3. Endpoints

### 3.1 `GET /api/v1/health`

The health endpoint is versioned under `/api/v1` so all application API
traffic follows one convention. It is intended for service/process readiness,
not detailed dependency diagnostics.

#### Response: `200 OK`

```json
{
  "status": "ok",
  "service": "gitlab-monitoring-api",
  "version": "1.0.0"
}
```

`status` is currently `ok`. A future deployment may return `503 Service
Unavailable` when the API cannot serve requests, without exposing database
credentials or infrastructure details.

### 3.2 `GET /api/v1/pipelines`

Returns pipeline records after applying filters, stable sorting, and optional
pagination.

#### Query parameters

All parameters are optional.

| Parameter | Type | Default | Validation and behavior |
| --- | --- | --- | --- |
| `search` | string | none | Trimmed, case-insensitive substring search over pipeline ID, project name, full commit SHA, commit title, commit author, and ref. Empty or whitespace-only values are ignored. |
| `project` | string | none | Exact project ID match. `all` is treated as no project filter for compatibility with the current UI. |
| `ref` | string | none | Exact branch/tag ref match. `all` is treated as no ref filter. |
| `status` | enum | none | Exact match. Allowed pipeline values: `success`, `failed`, `running`, `canceled`, `pending`, `skipped`. `all` is treated as no status filter. |
| `sortBy` | enum | `startedAt` | Allowed values: `startedAt`, `durationSeconds`, `id`. |
| `sortOrder` | enum | `desc` | Allowed values: `asc`, `desc`. |
| `page` | integer | `1` | Positive integer. One-based page number. |
| `pageSize` | integer | `25` | Integer from 1 through 100. |

The current frontend also has an internal `dateRange` filter (`24h`, `7d`,
`14d`, or `30d`) but does not send it in the URL or expose it in the active
filter bar. It is therefore not part of the initial API contract. If the
frontend later exposes it, it should be added as a separately versioned
contract change rather than silently inferred by the backend.

#### Sorting

The server must use the requested primary sort and a stable `id` tie-breaker.
For example, `sortBy=startedAt&sortOrder=desc` sorts by `startedAt` descending
and then by `id` descending. `durationSeconds` sorts with `null` values before numeric durations in both
directions. Numeric values and the `id` tie-breaker follow the requested
direction. This keeps unfinished records deterministic without treating a
missing duration as a completed zero-second run.

#### Response: `200 OK`

```json
{
  "items": [
    {
      "id": 489223,
      "projectId": "polaris-platform",
      "projectName": "Polaris Platform",
      "projectPath": "polaris-cloud/polaris-platform",
      "ref": "feature/polaris-batch-v3",
      "commitSha": "c4e82b79a1f26488d01bfa82947e62a03429dd11",
      "commitShortSha": "c4e82b79",
      "commitTitle": "feat(orchestrator): add parallel DAG chunking",
      "commitAuthor": "Marcus Chen",
      "status": "failed",
      "source": "merge_request_event",
      "user": {
        "id": 108,
        "name": "Marcus Chen",
        "username": "mchen",
        "avatarUrl": null
      },
      "createdAt": "2026-10-09T01:10:04Z",
      "startedAt": "2026-10-09T01:10:20Z",
      "finishedAt": "2026-10-09T01:18:42Z",
      "durationSeconds": 502,
      "stageCount": 5,
      "jobCount": 11,
      "failedJobCount": 1,
      "webUrl": null,
      "mergeRequestId": 894,
      "mergeRequestIid": 894,
      "coverage": "84.1%"
    }
  ],
  "summary": {
    "totalPipelines": 1,
    "successful": 0,
    "failed": 1,
    "running": 0,
    "canceled": 0,
    "pending": 0,
    "skipped": 0,
    "successRate": 0,
    "avgDurationSeconds": 502
  },
  "recentPipelines": [
    {
      "id": 489223,
      "status": "failed",
      "projectId": "polaris-platform",
      "projectName": "Polaris Platform",
      "ref": "feature/polaris-batch-v3",
      "startedAt": "2026-10-09T01:10:20Z",
      "durationSeconds": 502
    }
  ],
  "recentFailures": [
    {
      "pipeline": {
        "id": 489223,
        "status": "failed",
        "projectId": "polaris-platform",
        "projectName": "Polaris Platform",
        "ref": "feature/polaris-batch-v3",
        "startedAt": "2026-10-09T01:10:20Z"
      },
      "failedJob": {
        "id": 10884,
        "name": "integration-tests-distributed",
        "stage": "test",
        "status": "failed",
        "failureMessage": "TestChunkPartitionRebalance: timeout signal"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

`items` is always an array. `pagination` is always present in the API even
though the current prototype renders the complete filtered list and does not
paginate it.

`summary` is calculated from the complete filtered and sorted-independent
dataset before pagination is applied. It therefore does not change when
`page` or `pageSize` changes. `recentPipelines` contains up to five records
from that same filtered dataset, ordered by `startedAt desc, id desc`.
`recentFailures` contains up to four failed pipelines from that dataset,
ordered the same way, with the first failed job when one is available. These
fields provide the current Overview data without requiring a separate
overview endpoint.

The current TypeScript `Pipeline` interface uses `number` rather than
`number | null` for `durationSeconds`, and some running mock records contain
an elapsed numeric value. The proposed API uses `null` when no authoritative
duration exists so missing data is not confused with a completed zero-second
run. Before the frontend consumes such responses, its duration type and
formatter must be updated deliberately; this is a documented integration
mismatch, not a reason to fabricate a completed duration.

### 3.3 `GET /api/v1/pipelines/{pipeline_id}`

Returns one pipeline and its ordered stage/job hierarchy. `{pipeline_id}` is a
positive integer matching the frontend's numeric route parameter
`/pipelines/:pipelineId`.

#### Response: `200 OK`

```json
{
  "id": 489223,
  "projectId": "polaris-platform",
  "projectName": "Polaris Platform",
  "projectPath": "polaris-cloud/polaris-platform",
  "ref": "feature/polaris-batch-v3",
  "commitSha": "c4e82b79a1f26488d01bfa82947e62a03429dd11",
  "commitShortSha": "c4e82b79",
  "commitTitle": "feat(orchestrator): add parallel DAG chunking",
  "commitAuthor": "Marcus Chen",
  "status": "failed",
  "source": "merge_request_event",
  "user": {
    "id": 108,
    "name": "Marcus Chen",
    "username": "mchen",
    "avatarUrl": null
  },
  "createdAt": "2026-10-09T01:10:04Z",
  "startedAt": "2026-10-09T01:10:20Z",
  "finishedAt": "2026-10-09T01:18:42Z",
  "durationSeconds": 502,
  "stageCount": 5,
  "jobCount": 11,
  "failedJobCount": 1,
  "webUrl": null,
  "mergeRequestId": 894,
  "mergeRequestIid": 894,
  "coverage": "84.1%",
  "stages": [
    {
      "name": "prepare",
      "status": "success",
      "order": 0,
      "jobs": [
        {
          "id": 10881,
          "pipelineId": 489223,
          "projectId": "polaris-platform",
          "projectName": "Polaris Platform",
          "name": "fetch-go-modules",
          "stage": "prepare",
          "status": "success",
          "startedAt": "2026-10-09T01:10:20Z",
          "finishedAt": "2026-10-09T01:11:05Z",
          "durationSeconds": 45,
          "runnerName": "runner-spot-eu-west-01",
          "runnerTags": ["linux", "spot"],
          "failureMessage": null,
          "failureExitCode": null,
          "allowFailure": false,
          "webUrl": null
        }
      ],
      "totalJobs": 1,
      "passedJobs": 1,
      "failedJobs": 0,
      "durationSeconds": 45
    },
    {
      "name": "test",
      "status": "failed",
      "order": 2,
      "jobs": [
        {
          "id": 10884,
          "pipelineId": 489223,
          "projectId": "polaris-platform",
          "projectName": "Polaris Platform",
          "name": "integration-tests-distributed",
          "stage": "test",
          "status": "failed",
          "startedAt": "2026-10-09T01:15:25Z",
          "finishedAt": "2026-10-09T01:18:42Z",
          "durationSeconds": 197,
          "runnerName": "runner-spot-eu-west-03",
          "runnerTags": ["linux", "distributed-cluster"],
          "failureMessage": "TestChunkPartitionRebalance: expected 128 partitions settled within 45s SLA, received timeout signal",
          "failureExitCode": 137,
          "allowFailure": false,
          "webUrl": null
        }
      ],
      "totalJobs": 1,
      "passedJobs": 0,
      "failedJobs": 1,
      "durationSeconds": 197
    }
  ]
}
```

The example shows only representative stage groups; a real response includes
all available groups in ascending `order`. Stages with no jobs are omitted,
matching the current `getStageGroupsForPipeline` behavior. Jobs are ordered
within each stage by the upstream/API order and must have unique IDs within
the response.

`failureMessage`, `failureExitCode`, `allowFailure`, `runnerName`, `runnerTags`,
and `webUrl` are nullable or optional because the current mock records do not
provide them for every job. The frontend should show failure details only when
the corresponding fields are present.

#### Response: `404 Not Found`

```json
{
  "error": {
    "code": "pipeline_not_found",
    "message": "Pipeline 489999 was not found.",
    "details": null,
    "requestId": "01J9EXAMPLE"
  }
}
```

The frontend currently displays an empty not-found state for unknown or
non-numeric route IDs. The API should return this same semantic outcome for a
valid but missing numeric ID.

### 3.4 `GET /api/v1/projects`

Returns configured project metadata and the derived statistics currently
displayed by the Projects page. The endpoint supports an optional
`includeStats` flag to avoid adding a second project-statistics endpoint that
the current frontend does not need.

#### Query parameters

| Parameter | Type | Default | Validation and behavior |
| --- | --- | --- | --- |
| `includeStats` | boolean | `true` | Accept `true` or `false`. When `false`, return only `items` with `stats: null` per item. |

#### Response: `200 OK`

```json
{
  "items": [
    {
      "id": "atlas-api",
      "name": "Atlas API",
      "path": "atlas-platform/atlas-api",
      "product": "Core Cloud Platform",
      "releaseStream": "v2.8-mainline",
      "solutionType": "REST & GraphQL Microservice",
      "infrastructureType": "AWS EKS (Kubernetes 1.30)",
      "deploymentType": "Blue-Green Deployment",
      "defaultBranch": "main",
      "description": "High-throughput identity and routing gateway handling tenant session states.",
      "stats": {
        "totalPipelines": 12,
        "successCount": 8,
        "failedCount": 2,
        "runningCount": 1,
        "successRate": 80,
        "avgDurationSeconds": 411,
        "latestPipeline": {
          "id": 489224,
          "status": "running",
          "startedAt": "2026-10-09T01:52:35Z",
          "ref": "main"
        }
      }
    }
  ]
}
```

`latestPipeline` is `null` when a project has no pipelines. Statistics use
the same rules as the current data source:

- `successRate` is successful terminal pipelines divided by terminal
  pipelines with status `success`, `failed`, or `canceled` and a non-null
  `finishedAt`, multiplied by 100.
- Running, pending, skipped, and unfinished pipelines are not in the success
  rate denominator.
- `avgDurationSeconds` includes only records with a non-null `finishedAt` and
  a finite, non-negative duration. It is rounded to the nearest integer.
- `totalPipelines` includes all pipeline statuses.
- `latestPipeline` is selected by greatest `startedAt`, not by ID.

The current Projects page uses `totalPipelines`, `latestPipeline.status`, and
`latestPipeline.startedAt`; the other statistics remain available for the
existing `ProjectStats` type and future project summaries.

## 4. Schemas

### 4.1 Pipeline

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `id` | yes | integer | Positive pipeline identifier. |
| `projectId` | yes | string | Stable internal project identifier. |
| `projectName` | yes | string | Display name. |
| `projectPath` | yes | string | Repository path. |
| `ref` | yes | string | Branch or tag ref. |
| `commitSha` | yes | string | Full commit SHA. |
| `commitShortSha` | yes | string | Display short SHA. |
| `commitTitle` | yes | string | Commit title. |
| `commitAuthor` | yes | string | Commit author display name. |
| `status` | yes | `PipelineStatus` | See allowed values below. |
| `source` | yes | `PipelineSource` | See allowed values below. |
| `user` | yes | `PipelineUser` | Triggering user. |
| `createdAt` | yes | timestamp | Creation time. |
| `startedAt` | yes | timestamp | Start time. |
| `finishedAt` | yes | timestamp or null | Null for unfinished pipelines. |
| `durationSeconds` | yes | integer or null | Null for unfinished or invalid completed duration. |
| `stageCount` | yes | integer | Number of stages represented by the pipeline. |
| `jobCount` | yes | integer | Total jobs. |
| `failedJobCount` | yes | integer | Failed jobs. |
| `webUrl` | no | string or null | Genuine backend-provided GitLab URL only. |
| `mergeRequestId` | no | integer or null | Upstream merge-request ID when available. |
| `mergeRequestIid` | no | integer or null | Project-local merge-request IID when available. |
| `coverage` | no | string or null | Preserve current display format, such as `89.4%`. |

Allowed pipeline statuses are `success`, `failed`, `running`, `canceled`,
`pending`, and `skipped`. Allowed pipeline sources are `push`,
`merge_request_event`, `schedule`, `web`, `api`, and `trigger`.

### 4.2 Project

`Project` contains the fields in the frontend `Project` interface:
`id`, `name`, `path`, `product`, `releaseStream`, `solutionType`,
`infrastructureType`, `deploymentType`, `defaultBranch`, and `description`.
These are required strings in the current prototype. Whether all
classification fields are available for every real GitLab project must be
confirmed before making them database `NOT NULL` columns.

### 4.3 Pipeline user

```json
{
  "id": 104,
  "name": "Elena Rostova",
  "username": "erostova",
  "avatarUrl": null
}
```

`avatarUrl` is optional/nullable because it is absent from current mock user
records. It must be an HTTPS URL when supplied by the backend.

### 4.4 Job

`Job` fields map directly to the current frontend `Job` interface:
`id`, `pipelineId`, `projectId`, `projectName`, `name`, `stage`, `status`,
`startedAt`, `finishedAt`, `durationSeconds`, `runnerName`, `runnerTags`,
`failureMessage`, `failureExitCode`, `allowFailure`, and `webUrl`.

Allowed job statuses are `success`, `failed`, `running`, `canceled`,
`pending`, `skipped`, and `manual`. Allowed stage names currently are
`prepare`, `build`, `test`, `security`, `package`, and `deploy`.

`manual` is a job status only; it is not currently a pipeline status.
`finishedAt` and `durationSeconds` follow the same unfinished-duration rules
as pipelines. The current `Job` interface also declares `durationSeconds` as a
number and running mock jobs can contain elapsed values, so adopting nullable
API durations will require the same small frontend type/formatter adjustment.
Failure fields are nullable and should not be fabricated.

### 4.5 Stage group

A stage group contains:

- `name`: one of the current `StageName` values.
- `status`: a derived `JobStatus`.
- `order`: integer ordering key; current order is prepare 0, build 1, test 2,
  security 3, package 4, deploy 5.
- `jobs`: ordered array of `Job`.
- `totalJobs`, `passedJobs`, and `failedJobs`: non-negative counts.
- `durationSeconds`: sum of represented job durations; the implementation
  must document how unfinished jobs with null durations are excluded.

The current prototype derives stage status deterministically using this
precedence: `failed` if any job failed; otherwise `canceled` if any job was
canceled; otherwise `running` if any job is running; otherwise `pending` if
any job is pending; otherwise `manual` if any job is manual; otherwise
`skipped` if all jobs are skipped; otherwise `success` when all remaining jobs
are successful. A mixed skipped/successful group is `success`, while a group
with no jobs is omitted. The backend must preserve this rule.

### 4.6 Summary metrics

The current frontend uses these fields internally for the Overview cards and
derived calculations:

```json
{
  "totalPipelines": 42,
  "successful": 30,
  "failed": 6,
  "running": 2,
  "canceled": 2,
  "pending": 1,
  "skipped": 1,
  "successRate": 78.95,
  "avgDurationSeconds": 412
}
```

No separate summary endpoint is required by the current route contract. If
the Overview page is moved to server-backed data, these metrics should be
returned by a documented extension of the pipeline list response or by a
future endpoint rather than recalculated inconsistently in multiple clients.

## 5. Error format

All non-success responses should use this shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "One or more query parameters are invalid.",
    "details": [
      {
        "field": "pageSize",
        "reason": "must be between 1 and 100"
      }
    ],
    "requestId": "01J9EXAMPLE"
  }
}
```

Required error categories:

- `400 Bad Request` with `validation_error` for malformed IDs, invalid enums,
  invalid booleans, invalid pagination values, or invalid timestamp inputs.
- `404 Not Found` with `project_not_found` or `pipeline_not_found` when an
  explicitly requested resource does not exist.
- `500 Internal Server Error` with `internal_error` for unexpected failures.
  The response must not include stack traces, SQL, GitLab tokens, upstream
  credentials, or sensitive infrastructure details.

FastAPI validation errors may be mapped into this stable envelope so the
frontend does not depend on framework-specific error formatting.

## 6. Frontend compatibility mapping

| Frontend behavior/type | API contract |
| --- | --- |
| `pipelineService.getPipelines(filters)` | `GET /api/v1/pipelines` with the same filter and sort parameter names. |
| `pipelineService.getPipelineById(id)` | `GET /api/v1/pipelines/{pipeline_id}`. |
| `pipelineService.getStageGroups(id)` | `stages` in the pipeline detail response. |
| `projectService.getProjects()` and `getProjectStats()` | `GET /api/v1/projects`, with `includeStats=true`. |
| `/pipelines?project=<id>` | `project` query parameter on the pipeline list. |
| `/pipelines/:pipelineId` | Numeric `{pipeline_id}` path parameter. |
| `PipelineStatus` | `success`, `failed`, `running`, `canceled`, `pending`, `skipped`. |
| `JobStatus` | Pipeline detail job and stage status values, including `manual`. |
| Missing `webUrl` in mocks | `null` or omission; frontend must not invent a GitLab URL. |
| Numeric running durations in mocks | API may return `null` when no authoritative duration exists; frontend must handle `number | null` before adoption. |
| Full filtered mock list | Paginated `items` plus `pagination`; the frontend must adopt pagination explicitly before requesting pages beyond the default. |

The current mock data contains fixed timestamps around
`2026-10-09T03:00:00Z` and synthetic jobs for pipelines without explicit job
records. These are prototype implementation details, not API guarantees. A
real backend must return persisted/upstream values and must not synthesize
failure messages, URLs, timestamps, or job records to conceal missing data.

## 7. Assumptions requiring confirmation

The following cannot be confirmed from the frontend or without company GitLab
access:

1. Whether the internal project classification fields (`product`,
   `releaseStream`, `solutionType`, `infrastructureType`, and
   `deploymentType`) are authoritative database fields, derived configuration,
   or display-only metadata.
2. Whether pipeline and job IDs are globally unique across all configured
   GitLab instances/projects, or whether a compound upstream identity is
   needed internally.
3. Whether `coverage` should remain a formatted string or become a numeric
   percentage with a separate display formatter.
4. Which GitLab statuses and sources may appear in production beyond the
   current mock enum values, and how unknown upstream values should be
   represented.
5. Whether the backend should expose GitLab `webUrl` values for all records
   and which URL allowlist/security policy applies.
6. Whether project statistics should be computed over all stored records or a
   configured retention/date window.
7. Whether the frontend should request server pagination immediately or
   continue receiving the complete filtered set for the initial integration.
8. Whether authentication, authorization, and tenant/project visibility rules
   are required before production use. They are intentionally out of scope
   here.

## 8. Validation performed

- Inspected the current TypeScript interfaces for pipelines, projects, jobs,
  users, stage groups, and summary metrics.
- Inspected centralized mock pipelines, projects, and jobs.
- Inspected `dataSource`, `pipelineService`, and `projectService`.
- Inspected active routes and route/query parameter behavior.
- Confirmed the active pipeline filters are search, project, ref, status,
  sorting field, and sorting order.
- Confirmed current filtering is in-memory and has no active pagination.
- Confirmed pipeline details resolve numeric IDs and render ordered stage/job
  groups.
- Confirmed summary success-rate and average-duration rules from the current
  data source.
- Confirmed project navigation uses `/pipelines?project=<projectId>`.
- No application source, dependency, lockfile, or build configuration was
  changed.

### Check status

| Check | Status | Result |
| --- | --- | --- |
| Frontend source inspection | PASS | Relevant types, data, services, routes, and UI consumers were inspected. |
| Required endpoint coverage | PASS | Health, pipeline list, pipeline detail, and project endpoints are defined. |
| Schema compatibility review | PASS | Existing status values, fields, nullability, stage ordering, and metric rules are documented. |
| Live API behavior | NOT VERIFIED | No backend exists and no API request was made. |
| GitLab integration behavior | NOT VERIFIED | No GitLab connection or credentials are available or used. |
| Backend implementation | NOT RUN | Deliberately out of scope. |

## 9. Recommended next implementation step

Implement Pydantic response/query models and read-only FastAPI handlers for
`/api/v1/health`, `/api/v1/pipelines`, `/api/v1/pipelines/{pipeline_id}`, and
`/api/v1/projects` against repository-backed records. Add contract tests for
filter semantics, stable sorting, pagination metadata, null durations, status
mapping, project statistics, and `404` behavior before replacing the frontend
mock service.
