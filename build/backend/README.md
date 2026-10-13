# Atlas Backend

Production-oriented backend for the Atlas GitLab CI/CD monitoring, build tracking, stable baseline promotion, and release management dashboard.

---

## 1. Architecture Overview

The backend is built with FastAPI, Pydantic v2, SQLAlchemy 2.x, and PostgreSQL (via `psycopg 3`), structured in strict layered domains:

```
backend/
├── app/
│   ├── api/             # HTTP endpoints and versioned routers (FastAPI)
│   │   ├── router.py    # Master API v1 router
│   │   └── v1/
│   │       └── health.py # Liveness (/health/live) and readiness (/health/ready)
│   ├── core/            # Configuration, logging, centralized exceptions
│   │   ├── config.py    # Pydantic Settings with .env loading
│   │   ├── logging.py   # Structured console logging
│   │   └── exceptions.py # Domain exceptions and centralized handlers
│   ├── db/              # Engine, sessions, declarative base (Milestone 2)
│   ├── models/          # SQLAlchemy persistence models (Milestone 3)
│   ├── repositories/    # Database queries and persistence operations (Milestone 4)
│   ├── schemas/         # Pydantic serialization and validation schemas
│   │   └── common.py    # Health, pagination, error schemas
│   ├── services/        # Business logic and workflow orchestration (Milestone 5)
│   ├── integrations/    # External clients (GitLab client scheduled for Milestone 8)
│   │   └── gitlab/
│   ├── middleware/      # Application middleware
│   └── main.py          # FastAPI application factory and lifecycle
├── tests/               # Pytest automated test suite
│   ├── conftest.py      # Test fixtures (TestClient and AsyncClient)
│   └── test_health.py   # Health, CORS, and OpenAPI tests
├── .env.example         # Template for environment variables
├── .gitignore           # Python and environment exclusions
├── pyproject.toml       # Package dependencies and pytest configuration
├── PROJECT_STATE.md     # Single authoritative backend state document
└── README.md            # Setup and operations guide
```

---

## 2. Prerequisites

- Python 3.12+ (tested with Python 3.13.15)
- PostgreSQL (required starting in Milestone 2)

---

## 3. Quickstart & Local Setup

### Step 1: Create and Activate Virtual Environment

From the `backend/` directory:

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -e ".[dev]"
```

Or install using pinned dependencies:
```bash
pip install fastapi uvicorn[standard] pydantic pydantic-settings sqlalchemy alembic "psycopg[binary]" pytest httpx pytest-asyncio
```

### Step 3: Configure Environment

Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Review settings in `.env`:
- `HOST`: Server bind address (`0.0.0.0` or `127.0.0.1`)
- `PORT`: Server port (default `8000`)
- `CORS_ORIGINS`: Allowed origins (default `["http://localhost:3000", "http://127.0.0.1:3000"]`)
- `DATABASE_URL`: PostgreSQL connection URI (`postgresql+psycopg://...`)
- `LOG_LEVEL`: Logging verbosity (`INFO`, `DEBUG`)

---

## 4. Running the Development Server

Start the API server with Uvicorn:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

When started:
- API Base: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- ReDoc Documentation: `http://127.0.0.1:8000/redoc`
- Process Liveness Probe: `http://127.0.0.1:8000/health/live` (or `/api/v1/health/live`)
- Application Readiness Probe: `http://127.0.0.1:8000/health/ready` (or `/api/v1/health/ready`)

---

## 5. Running Automated Tests

Run the full test suite with `pytest`:

```bash
pytest -v
```

Run with coverage:
```bash
pytest --cov=app tests/
```

---

## 6. Development Milestones Roadmap

- **Milestone 1 (Complete):** Repository inspection, FastAPI application foundation, configuration, structured logging, centralized exceptions, liveness/readiness probes, and automated test suite.
- **Milestone 2 (Next):** PostgreSQL connection setup, SQLAlchemy session management, Alembic migration configuration, database readiness checks.
- **Milestone 3:** Core domain data models, constraints, and initial schema migrations.
- **Milestone 4:** Read-only REST endpoints for products, branches, commits, builds, stable baselines, releases, and activity.
- **Milestone 5:** Workflow business rules (promotions, release transitions, audit records).
- **Milestone 6:** Frontend integration and contract verification with `build/frontend/`.
- **Milestone 7:** Enterprise authentication and server-side authorization.
- **Milestone 8:** GitLab integration client and reconciliation.
- **Milestone 9:** Production hardening, audit review, and deployment configuration.
