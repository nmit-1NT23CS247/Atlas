# GitLab Monitoring Dashboard Backend

This is the Phase 1/2, read-only FastAPI backend for the dashboard. It serves
deterministic local development records derived from the frontend mock data.
It does not connect to GitLab and does not contain credentials, webhooks,
authentication, polling, or live synchronization.

## Requirements

- Python 3.11 or newer
- A virtual environment is recommended

## Setup

From the repository root:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

## Run

```powershell
uvicorn app.main:app --app-dir backend --reload
```

The default SQLite database is `backend/dashboard.db`. Set `DATABASE_URL` to
use another SQLAlchemy-compatible database URL. SQLite is the intended local
development database; the models use standard SQLAlchemy types and
relationships so a future PostgreSQL configuration can be introduced without
changing the HTTP contract.

The database tables are created on startup. Seed insertion is idempotent:
when the projects table already contains data, the development seed is not
inserted again. Seed records are not live GitLab records.

## Tests

```powershell
python -m pytest backend\tests -q
```

The tests use isolated temporary SQLite databases and currently cover health,
filters, sorting, pagination, summaries, recent records, details, projects,
null durations, validation errors, status derivation, and seed idempotency.
Alembic is intentionally not included because the schema is still a small,
development-only seed schema and no migration history is required yet.

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/pipelines`
- `GET /api/v1/pipelines/{pipeline_id}`
- `GET /api/v1/projects`

See the repository-level `API_CONTRACT.md` for query parameters, JSON shapes,
status rules, pagination, error envelopes, and known frontend compatibility
gaps.
