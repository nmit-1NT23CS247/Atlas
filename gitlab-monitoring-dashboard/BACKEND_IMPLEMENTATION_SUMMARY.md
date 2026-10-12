# Backend Phase 2 — Repository Reliability and API Contract Tests

## 1. Executive summary

Phase 2 audited and strengthened the existing read-only FastAPI backend before
frontend integration. The backend remains intentionally small:

- FastAPI HTTP layer
- Pydantic response and validation schemas
- SQLAlchemy 2.x models and repository helpers
- SQLite development database
- Deterministic, idempotent seed records
- Pytest/FastAPI TestClient contract coverage

No GitLab connection, credentials, authentication, authorization, polling,
webhooks, background workers, caching, analytics, or frontend integration was
added.

Final backend verification status:

- **14 tests passed**
- Tests passed on **two consecutive complete runs**
- Python compilation passed
- UTC timestamp serialization was verified as required by the contract
- PostgreSQL behavior remains **unverified** because no PostgreSQL server was
  installed or configured

## 2. Files inspected

The following source-of-truth and implementation files were reviewed before
changes:

- `API_CONTRACT.md`
- `backend/app/config.py`
- `backend/app/db.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/seed.py`
- `backend/app/repository.py`
- `backend/app/main.py`
- `backend/tests/test_api.py`
- `backend/README.md`
- Frontend TypeScript models, centralized mock projects/pipelines/jobs, and
  frontend service behavior used by the backend contract

## 3. Files changed

### `API_CONTRACT.md`

Updated the documented duration sorting convention so implementation and tests
agree:

- Null durations sort before numeric durations in both ascending and
  descending requests.
- Numeric values and ID tie-breakers follow the requested direction.

The existing contract rules for complete-dataset summaries, recent records,
pagination, UTC timestamps, nullable durations, and stage status precedence
remain authoritative.

### `backend/app/db.py`

Added `UTCDateTime`, a SQLAlchemy `TypeDecorator` that:

- Normalizes bound timestamps to UTC.
- Restores UTC awareness when SQLite returns naive datetimes.
- Uses `DateTime(timezone=True)` for database dialects that support timezone
  metadata.

This prevents SQLite's timezone behavior from leaking non-UTC timestamps into
the API.

### `backend/app/models.py`

Changed pipeline and job timestamp columns to use `UTCDateTime`. No model
relationships or table names were redesigned.

### `backend/app/schemas.py`

- Replaced deprecated Pydantic `json_encoders` usage with a field serializer.
- Serializes all API datetimes as ISO 8601 UTC strings with a `Z` suffix.
- Preserved the existing camelCase JSON contract and snake_case Python fields.

### `backend/app/repository.py`

- Corrected duration sorting so null values consistently appear before
  numeric values in both directions.
- Preserved stable numeric/date sorting and ID tie-break behavior.
- Kept SQLAlchemy expressions portable: `ilike`, `cast`, standard comparisons,
  and ORM relationships are used without SQLite-only SQL functions.

### `backend/app/main.py`

- Corrected validation error wording from query-only wording to general request
  parameter wording, covering query and path validation.
- Corrected recent failure selection so it considers the entire filtered
  dataset, not only the first five recent pipelines.
- Kept summary calculations independent of pagination.
- Kept session scopes explicit with context-managed SQLAlchemy sessions.

### `backend/tests/test_api.py`

Expanded the test suite from 9 tests to 14 tests. Coverage is described below.

## 4. Backend behavior and seed statistics

The normal development database contains only the deterministic development
seed records:

| Entity | Count |
| --- | ---: |
| Projects | 6 |
| Pipelines | 4 |
| Jobs | 8 |

Seed pipeline status distribution:

| Status | Count |
| --- | ---: |
| `success` | 1 |
| `failed` | 2 |
| `running` | 1 |

Seed job status distribution:

| Status | Count |
| --- | ---: |
| `success` | 4 |
| `failed` | 2 |
| `running` | 1 |
| `skipped` | 1 |

The test suite uses a unique temporary SQLite file per test through
`tmp_path`. Test records are not written to `backend/dashboard.db`. A
repeat-initialization test confirms that creating the application twice against
the same isolated database keeps exactly 6 projects and 4 pipelines rather
than duplicating seed rows.

The normal development database was inspected after verification:

- Projects: 6
- Pipelines: 4
- Jobs: 8
- Pipeline IDs: `489221`, `489222`, `489223`, `489224`

No test-only IDs or test fixture rows were found.

## 5. API contract test coverage

The 14 tests cover:

1. Health response status and shape.
2. Search by pipeline ID, project name, commit SHA, commit title, commit
   author, and ref.
3. Exact project filtering.
4. Exact ref filtering.
5. Exact status filtering.
6. `all` behavior for project, ref, and status filters.
7. Ascending and descending ID sorting.
8. Equal-primary-value ID tie-break ordering.
9. Null-duration ordering in both directions.
10. Page boundaries, empty pages, empty filtered results, and total metadata.
11. Summary counts calculated over all filtered records rather than only the
    current page.
12. Recent pipeline and recent failure ordering under filters.
13. Pipeline detail stage order, job hierarchy, failure messages, and
    unfinished null durations.
14. Project statistics, projects without pipelines, and `includeStats=false`.
15. Failed, running, pending, canceled, skipped, manual, and successful stage
    status derivation.
16. Missing pipeline, invalid pipeline path, invalid page size, invalid sort
    field/order, invalid status, and invalid boolean error envelopes.

The numbered list contains 16 behavior categories represented by 14 test
functions; several functions intentionally cover multiple related cases.

## 6. Exact verification commands and results

### Python environment

System Python was not available on PATH. An isolated local `uv` tool created a
repository-local ignored environment using CPython 3.12.15:

```powershell
uv venv backend\.venv --python 3.12
uv pip install --python backend\.venv\Scripts\python.exe -r backend\requirements.txt
```

No global package or system configuration was changed.

### Backend tests

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests -q
```

Result on first final run:

```text
14 passed, 1 warning
```

The same command was executed again immediately:

```text
14 passed, 1 warning
```

The remaining warning is from the installed Starlette/httpx TestClient
integration and does not represent a test failure.

### Python compilation

```powershell
backend\.venv\Scripts\python.exe -m compileall -q backend\app backend\tests
```

Result: **PASS**

### UTC response serialization

A temporary SQLite application was queried directly. The response produced:

```text
200 2026-10-09T01:10:04Z 2026-10-09T01:11:10Z
```

The temporary database was removed after verification.

## 7. Database isolation and seed idempotency

### Findings before changes

- Existing API tests already used temporary SQLite databases, so they did not
  intentionally target the normal development database.
- Each test created a fresh database path.
- SQLAlchemy sessions were context-managed.
- Seed initialization was guarded by existing project data.
- The implementation's timestamp behavior was not fully portable because
  SQLite returned naive datetime objects.
- Recent failures were incorrectly limited to the recent-pipeline slice.
- Duration null ordering did not match the written contract for descending
  requests.

### Corrections

- Added UTC-aware SQLAlchemy timestamp handling.
- Added explicit UTC JSON serialization.
- Corrected recent failure selection.
- Corrected null-duration ordering.
- Added repeat-initialization and normal database inspection checks.

## 8. PostgreSQL portability review

### Positive findings

- SQLAlchemy 2.x declarative mappings are used.
- Database selection remains controlled through `DATABASE_URL`.
- Models use standard `String`, `Integer`, `Boolean`, `JSON`, foreign keys,
  relationships, and timezone-aware `DateTime` intent.
- Queries use ORM expressions and standard SQLAlchemy `cast`, `ilike`, and
  comparisons.
- No SQLite-only date functions or raw SQL queries were introduced.
- Pagination is performed after deterministic application-level ordering.
- UTC timestamp normalization is explicit rather than dependent on SQLite.

### Remaining unverified behavior

- No PostgreSQL server was installed or configured.
- PostgreSQL JSON behavior, timezone round-tripping, index plans, and foreign
  key enforcement were not executed against PostgreSQL.
- A PostgreSQL driver is not included in the current requirements because the
  local implementation uses SQLite only. Adding one should be part of the
  PostgreSQL deployment phase.
- Schema migration behavior remains unverified; Alembic is still intentionally
  excluded for this development-only schema.

PostgreSQL compatibility is therefore **designed for**, not verified.

## 9. Deviations from `API_CONTRACT.md`

| Area | Status | Details |
| --- | --- | --- |
| Summary independent of pagination | PASS | Calculated from the complete filtered dataset. |
| Recent pipeline ordering | PASS | Up to five records ordered by `startedAt desc, id desc`. |
| Recent failure ordering | PASS | Up to four failed records from the complete filtered dataset. |
| Stage status precedence | PASS | Failed, canceled, running, pending, manual, all-skipped, then success. |
| UTC timestamps | PASS | API emits UTC timestamps with `Z`. |
| Null duration convention | PASS | Unfinished records use null duration in backend responses. |
| Null duration sorting | PASS | Nulls appear first in both directions as now documented. |
| Pagination metadata | PASS | Page, page size, total items, and total pages are returned. |
| Live GitLab data | NOT RUN | Deliberately not implemented. |
| Frontend API adoption | NOT RUN | Deliberately deferred to a later phase. |

The backend seed is a subset of the frontend mock records. This is an
implementation limitation, not an API shape deviation.

## 10. Major check status

| Check | Status | Evidence |
| --- | --- | --- |
| Relevant implementation inspection | PASS | All requested backend, contract, README, and frontend source-of-truth files reviewed. |
| Test database isolation | PASS | Every test uses a unique temporary SQLite database. |
| Predictable initial state | PASS | Fresh database creation and idempotent repeat initialization tested. |
| Seed idempotency | PASS | Reinitialization remains at 6 projects and 4 pipelines. |
| Session cleanup | PASS | API and verification sessions use context managers. |
| Contract tests | PASS | 14 tests passed twice. |
| Python compilation | PASS | `compileall` completed successfully. |
| PostgreSQL execution | NOT RUN | No PostgreSQL server was installed or configured. |
| Existing linter/formatter | NOT RUN | No backend linter or formatter configuration exists. No new tooling was introduced. |
| Frontend verification | NOT RUN | Frontend was explicitly out of scope and untouched. |
| Live GitLab integration | NOT RUN | Explicitly prohibited by this phase. |

## 11. Files intentionally untouched

- Frontend components
- Frontend services and types
- Frontend dependencies and lockfile
- GitLab integration code
- Infrastructure and deployment configuration

## 12. Recommended next step

Before frontend integration, run the same contract suite against a PostgreSQL
service using a disposable database and add a migration strategy once the
schema is no longer development-only. After that, implement a small frontend
API client behind the existing service boundary, deliberately updating
duration types to accept `null` and adopting server pagination.
