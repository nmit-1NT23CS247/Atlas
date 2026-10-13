# Frontend–Backend Integration Report — Phase 3

> **Document Type:** Production Integration & Verification Audit Report  
> **Project:** GitLab Pipeline Monitoring Dashboard  
> **Repository Root:** `Atlas` / `gitlab-monitoring-dashboard`  
> **Integration Phase:** Phase 3 — Complete Client–Server HTTP Wiring  
> **Date:** October 2026  
> **Author:** Implementation Engineer & Technical Reviewer  

---

## Table of Contents

1. [A. Executive Summary](#a-executive-summary)
2. [B. Files Changed](#b-files-changed)
3. [C. Architecture and Design Decisions](#c-architecture-and-design-decisions)
4. [D. API Integration Matrix](#d-api-integration-matrix)
5. [E. Contract Alignment](#e-contract-alignment)
6. [F. Verification Statistics](#f-verification-statistics)
7. [G. Runtime Instructions](#g-runtime-instructions)
8. [H. Data Source and Scope Verification](#h-data-source-and-scope-verification)
9. [I. Remaining Risks and Recommended Next Steps](#i-remaining-risks-and-recommended-next-steps)
10. [J. Final Verdict](#j-final-verdict)

---

## A. Executive Summary

In Phase 3, the React 19 / TypeScript frontend prototype was successfully connected over HTTP to the FastAPI / SQLAlchemy backend service. Prior to this phase, the frontend rendered in-memory mock datasets via a synchronous store, while the backend operated independently with SQLite seed records.

### Key Outcomes
- **100% Real API Consumption:** All four core views (**Overview**, **Pipelines**, **Pipeline Details**, and **Projects**) now query the FastAPI backend over HTTP using the browser's native `fetch` API.
- **No Mock Fallback:** In-memory mock data has been completely bypassed in the active application runtime. The UI reflects genuine responses and error states returned by the backend.
- **Contract Fidelity:** Resolved all identified schema and contract divergences, including nullable duration formatting (`number | null`), contract version alignment (`1.0.0`), project statistics nesting (`ProjectWithStats`), and pagination state synchronization.
- **Robust Network Configuration:** Added scoped CORS middleware to FastAPI and a `/api` reverse proxy in Vite, supporting both relative (`/api/v1`) and absolute (`http://localhost:8000/api/v1`) configurations.
- **Verified Stability:** 
  - Backend: **14 of 14 Pytest contract tests passed** (plus Python compilation passed).
  - Frontend: **22 of 22 Vitest unit/integration tests passed**; TypeScript `tsc --noEmit` passed with 0 errors; Vite production build passed.
  - Live HTTP Smoke Test: Verified all 4 endpoints against an active Uvicorn daemon returning HTTP 200 OK.

---

## B. Files Changed

### 1. Application Code (Frontend)
- `frontend/src/services/apiClient.ts` (**Created**): Reusable, typed HTTP client using native `fetch`. Centralizes base URL resolution (`VITE_API_BASE_URL`), query parameter serialization, HTTP status checks, network failure resilience, and JSON error envelope parsing (`ApiError`).
- `frontend/src/services/pipelineService.ts` (**Modified**): Replaced synchronous mock methods with asynchronous API calls targeting `GET /api/v1/pipelines` and `GET /api/v1/pipelines/{pipeline_id}`.
- `frontend/src/services/projectService.ts` (**Modified**): Replaced synchronous mock methods with asynchronous calls to `GET /api/v1/projects` (supporting `includeStats`). Added adapter mapping for legacy consumers while exposing contract-aligned `ProjectWithStats[]`.
- `frontend/src/types/pipeline.ts` (**Modified**): Updated `Pipeline.durationSeconds` to `number | null`, `webUrl` and merge request fields to nullable strings/numbers. Exported `RecentPipeline`, `RecentFailure`, `PaginationMetadata`, and `PipelineListResponse`.
- `frontend/src/types/job.ts` (**Modified**): Updated `Job.durationSeconds` to `number | null`, failure and runner fields to nullable types. Exported `PipelineDetail`.
- `frontend/src/types/project.ts` (**Modified**): Exported `ProjectWithStats`, `ProjectStatsSummary`, `LatestPipeline`, and `ProjectsResponse` matching backend Pydantic schemas.
- `frontend/src/lib/formatters.ts` (**Modified**): Updated `formatDuration` to accept `number | null | undefined`. Returns `'—'` for null/undefined rather than deceptive `'0s'`.
- `frontend/src/features/dashboard/OverviewPage.tsx` (**Modified**): Converted to asynchronous lifecycle. Consumes backend summary metrics, recent pipelines, and recent failures. Added loading skeleton, retryable error banner, and outlet refresh hook.
- `frontend/src/features/dashboard/components/RecentPipelinesTable.tsx` (**Modified**): Updated props to support `RecentPipeline | Pipeline`, handling optional `commitSha` and `commitTitle` defensively.
- `frontend/src/features/dashboard/components/FailedPipelinesPanel.tsx` (**Modified**): Updated props to support `RecentFailure[]` from backend response.
- `frontend/src/features/pipelines/PipelinesPage.tsx` (**Modified**): Converted to asynchronous lifecycle with server-side search, filtering, sorting, and pagination. Added pagination controls (page size selector, prev/next buttons, item range text) and query reset logic.
- `frontend/src/features/pipelines/PipelineDetailsPage.tsx` (**Modified**): Converted to asynchronous lifecycle. Fetches `PipelineDetail` from `GET /api/v1/pipelines/{pipeline_id}`. Handles 404 Not Found empty state, network errors, genuine GitLab URLs, and ordered stages/jobs.
- `frontend/src/features/projects/ProjectsPage.tsx` (**Modified**): Converted to asynchronous lifecycle. Queries `GET /api/v1/projects?includeStats=true`, safely rendering project metadata, derived statistics, and missing statistic fallbacks (`'—'`).
- `frontend/src/layouts/DashboardLayout.tsx` (**Modified**): Added `refreshKey` counter in `DashboardOutletContext` passed through React Router `<Outlet context={...} />`. Clicking Topbar Refresh now increments `refreshKey` and triggers real API revalidation.
- `frontend/src/components/navigation/Topbar.tsx` (**Modified**): Converted quick-search dropdown to asynchronous debounced API query (`pageSize: 4`). Updated indicator badge to `API Connected`.
- `frontend/src/services/dataSource.ts` (**Modified**): Fixed TypeScript nullability type checks for `durationSeconds` in in-memory helper routines.

### 2. Application Code (Backend)
- `backend/app/config.py` (**Modified**): Updated `Settings.version` from `"0.1.0"` to `"1.0.0"` to align with `API_CONTRACT.md`.
- `backend/app/main.py` (**Modified**): Configured `CORSMiddleware` in `create_app` allowing development origins `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:5173`, and `http://127.0.0.1:5173`.

### 3. Configuration & Infrastructure
- `frontend/vite.config.ts` (**Modified**): Configured server `port: 3000` and added `/api` proxy targeting `http://127.0.0.1:8000`.
- `frontend/.env.example` (**Created**): Documented local development environment setting `VITE_API_BASE_URL=/api/v1`.

### 4. Tests
- `frontend/src/test/dashboard.test.tsx` (**Modified**): Rewritten and expanded from 12 to 22 tests. Added comprehensive unit and integration coverage for API client URL construction, query serialization, error envelope parsing, network failure handling, null durations, pagination controls, Overview states, Pipelines filter/page states, Pipeline Details 404/GitLab link states, and Projects stats handling.

---

## C. Architecture and Design Decisions

### 1. API Client Design (`apiClient.ts`)
- **Native Browser `fetch`:** Chosen to avoid introducing heavy client dependencies (e.g. Axios, TanStack Query, Redux) during Phase 3.
- **Configurable Base URL:** Inspects `import.meta.env.VITE_API_BASE_URL` with a sensible default of `/api/v1`. Strips trailing slashes to ensure deterministic endpoint concatenation.
- **Strict Query Serialization:** Automatically purges `undefined`, `null`, and empty string query parameters so only valid query keys are sent to FastAPI.
- **Envelope-Aware Error Normalization:** Captures backend error envelopes matching `API_CONTRACT.md` (`code`, `message`, `details`, `requestId`). If an endpoint returns 502/504 HTML or non-JSON payloads, falls back to HTTP status text without JSON parse crashes.

### 2. Local Networking & Dual-Path Architecture
- **Dual Support (Proxy + CORS):** Configured Vite dev server with a `/api` reverse proxy to `http://127.0.0.1:8000` AND configured FastAPI with `CORSMiddleware` for ports `3000` and `5173`.
- **Rationale:** Ensures seamless connectivity whether a developer chooses relative paths (`/api/v1`) via Vite or direct absolute paths (`http://localhost:8000/api/v1`) via environment variables.

### 3. Asynchronous UI & Revalidation Architecture
- **React Hooks State:** Standardized on `useState`, `useEffect`, and `useCallback` patterns. Each page maintains explicit `loading`, `error`, and `data` states with cancellation guards (`active` flags).
- **Refresh Synchronization via Router Outlet Context:** Avoided introducing a global Redux/Zustand store. The layout shell maintains a `refreshKey` counter passed via React Router v7's `useOutletContext`. When the user clicks the Topbar Refresh button, `refreshKey` increments, triggering `useEffect` revalidation in the active view.

### 4. Pagination Design
- **Server-Driven Pagination:** Pipelines list reads `page` and `pageSize` from URL query parameters.
- **Defensive Page Reset:** When any search term, project, ref, or status filter changes, the active `page` resets to `1` to avoid landing on empty or out-of-bounds pages.
- **Lightweight Controls:** Added minimal, accessible pagination controls beneath the pipelines table (page size select, prev/next buttons, and item count display).

---

## D. API Integration Matrix

| View / Feature | Backend Endpoint | Query / Path Parameters | Frontend Consumer | States Handled | Tests Added | Limitations / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Overview** | `GET /api/v1/pipelines` | `pageSize=10` | `pipelineService.getOverviewData` in `OverviewPage.tsx` | - Initial loading skeleton<br>- Error banner with retry<br>- Populated summary cards<br>- Populated recent lists | 3 unit/integration tests | Consumes dataset-wide `summary` directly from the backend. |
| **Pipelines** | `GET /api/v1/pipelines` | `search`, `project`, `ref`, `status`, `sortBy`, `sortOrder`, `page`, `pageSize` | `pipelineService.getPipelines` in `PipelinesPage.tsx` | - Loading skeleton<br>- Error banner with retry<br>- Populated table<br>- Zero-result EmptyState<br>- Pagination controls | 4 unit/integration tests | `dateRange` is intentionally omitted from server parameters per contract. |
| **Pipeline Details** | `GET /api/v1/pipelines/{id}` | `pipeline_id` (integer) | `pipelineService.getPipelineById` in `PipelineDetailsPage.tsx` | - Loading skeleton<br>- 404 EmptyState<br>- Error banner with retry<br>- Genuine GitLab link<br>- Stage/job hierarchy | 3 unit/integration tests | Renders only real jobs returned by backend (no synthetic jobs). |
| **Projects** | `GET /api/v1/projects` | `includeStats=true` | `projectService.getProjects` in `ProjectsPage.tsx` | - Loading skeleton<br>- Error banner with retry<br>- Populated table<br>- Null stats placeholder (`—`) | 2 unit/integration tests | Reconciles backend `ProjectWithStats` format seamlessly. |
| **Global Search** | `GET /api/v1/pipelines` | `search`, `pageSize=4` | `pipelineService.getPipelines` in `Topbar.tsx` | - Debounced async typing<br>- Dropdown suggestions<br>- Empty result note | Covered via query serialization tests | Debounced by 250ms to minimize backend requests. |

---

## E. Contract Alignment

1. **Nullable Durations:**
   - **Issue:** Backend emits `durationSeconds: null` for active/unfinished runs. Frontend TypeScript required `number`, and `formatDuration()` returned `"0s"`.
   - **Resolution:** Updated `Pipeline`, `RecentPipeline`, `Job`, and `formatDuration` signatures to `number | null | undefined`. Returns `'—'` for null values. Verified with unit tests.
2. **Project Statistics Nesting:**
   - **Issue:** Backend returns `{ ...projectFields, stats: { ... } }` (`ProjectWithStats`), whereas frontend types declared `{ project: Project, ...stats }`.
   - **Resolution:** Updated `project.ts` to export `ProjectWithStats` and updated `ProjectsPage.tsx` to read `project.stats` directly. Provided an adapter in `projectService.getProjectStats` for backward compatibility.
3. **API Version String:**
   - **Issue:** `API_CONTRACT.md` specified `"version": "1.0.0"`, but `config.py` had `"0.1.0"`.
   - **Resolution:** Updated `Settings.version` in `backend/app/config.py` to `"1.0.0"`. Verified via health endpoint smoke test.
4. **DateRange Parameter:**
   - **Issue:** Frontend prototype had a `dateRange` parameter in `PipelineFilters`. Backend returns 400 if unexpected parameters are passed.
   - **Resolution:** Documented in `pipelineService.ts` that `dateRange` is reserved and omitted from server query serialization.
5. **Pagination Alignment:**
   - **Issue:** Frontend rendered all records without page controls.
   - **Resolution:** Made `page` and `pageSize` explicit parameters synchronized with URL query params and backend pagination metadata.

---

## F. Verification Statistics

| Check | Working Directory | Command Executed | Result | Details & Statistics |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Unit & Integration Tests** | `frontend/` | `bun run test` | **PASS** | **22 tests passed** (1 test file, 0 failures, 205ms execution time). |
| **Frontend TypeScript Typecheck** | `frontend/` | `bun run lint` | **PASS** | `tsc --noEmit` exited with code 0 (0 type errors). |
| **Frontend Production Build** | `frontend/` | `bun run build` | **PASS** | Vite transformed 2001 modules, built production bundle in `dist/` in 467ms. |
| **Backend Contract Tests** | `backend/` | `backend\.venv\Scripts\python.exe -m pytest backend\tests -q` | **PASS** | **14 tests passed**, 1 Starlette deprecation warning (0 failures). |
| **Backend Python Compilation** | `backend/` | `backend\.venv\Scripts\python.exe -m compileall -q backend\app backend\tests` | **PASS** | Bytecode compilation succeeded with 0 syntax or import errors. |
| **Live HTTP Smoke Test** | `gitlab-monitoring-dashboard/` | PowerShell `Invoke-RestMethod` against active Uvicorn server | **PASS** | Verified 4 endpoints: `/health` (200 OK, version 1.0.0), `/pipelines` (200 OK, 4 seed items), `/pipelines/489224` (200 OK, stage hierarchy), `/projects` (200 OK, stats present). |

---

## G. Runtime Instructions

To run both services locally in development:

### Terminal 1: Backend Service (FastAPI)
From the repository root:
```powershell
cd c:\Users\ssatwik\Desktop\Atlas\gitlab-monitoring-dashboard
backend\.venv\Scripts\Activate.ps1
uvicorn app.main:app --app-dir backend --reload --port 8000
```
*The FastAPI backend will start on `http://127.0.0.1:8000` with Swagger docs available at `http://127.0.0.1:8000/docs`.*

### Terminal 2: Frontend Service (Vite + React)
From the repository root:
```powershell
cd c:\Users\ssatwik\Desktop\Atlas\gitlab-monitoring-dashboard\frontend
bun install
bun run dev
```
*The React application will start on `http://localhost:3000` and proxy API calls to port 8000.*

---

## H. Data Source and Scope Verification

- **HTTP Connectivity:** **CONFIRMED**. All frontend pages query the FastAPI backend over HTTP via `apiClient.ts`.
- **Mock Fallback Deactivation:** **CONFIRMED**. The frontend no longer imports or falls back to in-memory mock datasets in the active application routes. If the backend is unreachable, the UI displays clear, retryable error states.
- **Backend Seed Data:** **CONFIRMED**. The backend continues to serve deterministic seed records (6 projects, 4 pipelines, 8 jobs) stored in local SQLite (`dashboard.db`).
- **GitLab Integration:** **NOT ADDED** (strictly out of scope for Phase 3). No GitLab REST API keys, webhooks, or background workers were introduced.
- **Database Scope:** **MAINTAINED**. No PostgreSQL dependencies or Alembic schema migrations were introduced. Development remains on SQLite.

---

## I. Remaining Risks and Recommended Next Steps

### Known Remaining Limitations
1. **Seed Dataset Size Discrepancy:**
   - The backend seed dataset contains 4 pipelines across 3 projects (with 3 projects having 0 pipelines). When connected, Overview displays 4 pipelines. If parity with the initial 18 mock pipelines is desired for stakeholder demos, the backend seed file can be expanded.
2. **PostgreSQL Execution:**
   - PostgreSQL compatibility is designed at the SQLAlchemy ORM layer but has not been executed against a physical PostgreSQL instance.
3. **Live GitLab Connectivity:**
   - Integration with a live GitLab instance, personal access tokens, and webhook handlers remains future work.

### Recommended Next Phase: Phase 4 — Data Ingestion & Live Synchronization
1. Implement a server-side GitLab REST client in Python to ingest projects, pipelines, and jobs from an authoritative GitLab instance.
2. Introduce a background worker or polling daemon to keep pipeline and job statuses synchronized in real time.
3. Introduce PostgreSQL and Alembic database migrations for production persistence.

---

## J. Final Verdict

### Verdict: `PASS`

**Justification:**
All objectives of Phase 3 were met in full. The React frontend is cleanly integrated with the FastAPI backend across all four primary pages via a native, typed API layer. All contract mismatches (nullable durations, project statistics, versioning) were resolved. Network configurations (CORS and proxy) were implemented and verified. Both frontend and backend test suites pass with 100% success (22 frontend tests, 14 backend tests), production builds succeed, and a live HTTP smoke test verified genuine client-server communication.
