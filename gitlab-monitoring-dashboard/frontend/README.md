# GitLab Pipeline Monitoring Dashboard

This directory contains the React and TypeScript frontend prototype for the
GitLab pipeline monitoring dashboard.

## Current scope

The application currently uses centralized mock records from `src/data` and
provides:

- Overview metrics for total, successful, failed, and running pipelines
- Recent pipelines and recent failures
- Pipeline search, filtering, and sorting
- Pipeline details with stages, jobs, statuses, and failure messages
- Project summaries with links to project-filtered pipelines

It does not yet connect to GitLab or a backend service. Refreshing the page
only refreshes the browser UI; it does not fetch new data. The FastAPI,
PostgreSQL, SQLAlchemy, Alembic, GitLab API, and webhook architecture remains
future work.

## Package manager

This project uses Bun. The repository includes `bun.lock` and pins Bun
`1.4.2` through `package.json`.

## Run locally

Prerequisite: Bun 1.4.2 or a compatible Bun 1.x release.

```sh
bun install
bun run dev
```

The development server runs on port 3000.

## Verification commands

```sh
bun run test
bun run lint
bun run build
```
