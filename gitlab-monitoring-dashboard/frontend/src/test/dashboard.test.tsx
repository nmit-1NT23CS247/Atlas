import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { StatusBadge } from '../components/data-display/StatusBadge';
import { formatDuration } from '../lib/formatters';
import { getApiBaseUrl, buildUrl, apiClient, ApiError } from '../services/apiClient';
import { pipelineService } from '../services/pipelineService';
import { projectService } from '../services/projectService';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { PipelinesPage } from '../features/pipelines/PipelinesPage';
import { PipelineDetailsPage } from '../features/pipelines/PipelineDetailsPage';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { PipelineListResponse, Pipeline } from '../types/pipeline';
import { PipelineDetail } from '../types/job';
import { ProjectsResponse } from '../types/project';

describe('GitLab Pipeline Monitoring Integration Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. API Base URL and Request Construction
  describe('API Base URL and Request Construction', () => {
    it('defaults base URL to /api/v1', () => {
      expect(getApiBaseUrl()).toBe('/api/v1');
    });

    it('builds URL without params', () => {
      expect(buildUrl('/pipelines')).toBe('/api/v1/pipelines');
    });

    it('builds URL with query parameters omitting null/undefined/empty', () => {
      const url = buildUrl('/pipelines', {
        search: 'atlas',
        status: undefined,
        ref: null,
        page: 1,
        empty: '',
      });
      expect(url).toBe('/api/v1/pipelines?search=atlas&page=1');
    });
  });

  // 2. Query Parameter Serialization
  describe('Query Parameter Serialization in pipelineService', () => {
    it('serializes search, project, ref, status, sorting, and pagination parameters', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [],
            summary: {
              totalPipelines: 0,
              successful: 0,
              failed: 0,
              running: 0,
              canceled: 0,
              pending: 0,
              skipped: 0,
              successRate: 0,
              avgDurationSeconds: 0,
            },
            recentPipelines: [],
            recentFailures: [],
            pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 0 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await pipelineService.getPipelines({
        search: 'feat(auth)',
        projectId: 'atlas-api',
        ref: 'main',
        status: 'running',
        sortBy: 'durationSeconds',
        sortOrder: 'asc',
        page: 2,
        pageSize: 10,
        dateRange: '7d', // Reserved, must be omitted from server params
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const requestedUrl = fetchSpy.mock.calls[0][0] as string;
      expect(requestedUrl).toContain('search=feat%28auth%29');
      expect(requestedUrl).toContain('project=atlas-api');
      expect(requestedUrl).toContain('ref=main');
      expect(requestedUrl).toContain('status=running');
      expect(requestedUrl).toContain('sortBy=durationSeconds');
      expect(requestedUrl).toContain('sortOrder=asc');
      expect(requestedUrl).toContain('page=2');
      expect(requestedUrl).toContain('pageSize=10');
      expect(requestedUrl).not.toContain('dateRange');
    });

    it('omits "all" filter values from query string', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [],
            summary: {},
            recentPipelines: [],
            recentFailures: [],
            pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
          }),
          { status: 200 }
        )
      );

      await pipelineService.getPipelines({
        projectId: 'all',
        ref: 'all',
        status: 'all',
      });

      const requestedUrl = fetchSpy.mock.calls[0][0] as string;
      expect(requestedUrl).toBe('/api/v1/pipelines');
    });
  });

  // 3 & 4. Successful and Error Response Parsing
  describe('HTTP Response and Error Envelope Handling', () => {
    it('parses successful 200 JSON responses', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'ok', service: 'gitlab-monitoring-api', version: '1.0.0' }), {
          status: 200,
        })
      );

      const data = await apiClient.get<{ status: string }>('/health');
      expect(data.status).toBe('ok');
    });

    it('parses 400 Bad Request error envelopes and throws ApiError with details', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                code: 'validation_error',
                message: 'Invalid pageSize value.',
                details: [{ field: 'pageSize', reason: 'must be between 1 and 100' }],
                requestId: 'req-12345',
              },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );

      await expect(apiClient.get('/pipelines', { pageSize: 0 })).rejects.toThrow(ApiError);
      try {
        await apiClient.get('/pipelines', { pageSize: 0 });
      } catch (err) {
        if (err instanceof ApiError) {
          expect(err.status).toBe(400);
          expect(err.code).toBe('validation_error');
          expect(err.message).toBe('Invalid pageSize value.');
          expect(err.details?.[0].field).toBe('pageSize');
          expect(err.requestId).toBe('req-12345');
        }
      }
    });

    it('handles 404 Not Found pipeline error envelopes', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 'pipeline_not_found',
              message: 'Pipeline 9999 was not found.',
            },
          }),
          { status: 404 }
        )
      );

      await expect(pipelineService.getPipelineById(9999)).rejects.toThrow('Pipeline 9999 was not found.');
    });
  });

  // 5. Network Failures and Malformed Responses
  describe('Network Failure and Malformed Response Resilience', () => {
    it('catches network fetch rejections and throws friendly ApiError', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.get('/health')).rejects.toThrow(/Network request failed/);
    });

    it('handles invalid JSON responses without crashing', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          statusText: 'Bad Gateway',
        })
      );

      await expect(apiClient.get('/health')).rejects.toThrow(ApiError);
    });
  });

  // 6. Null Pipeline and Job Durations
  describe('Duration Nullability and Formatters', () => {
    it('formats numeric durations correctly', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(502)).toBe('8m 22s');
      expect(formatDuration(3665)).toBe('1h 1m 5s');
    });

    it('formats null and undefined durations as placeholder instead of 0s', () => {
      expect(formatDuration(null)).toBe('—');
      expect(formatDuration(undefined)).toBe('—');
    });
  });

  // 7. StatusBadge Rendering
  describe('StatusBadge Rendering', () => {
    it('renders Passed badge correctly', () => {
      render(<StatusBadge status="success" />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('renders Failed badge correctly', () => {
      render(<StatusBadge status="failed" />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('renders Running badge correctly', () => {
      render(<StatusBadge status="running" />);
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  // 8. Overview Page Component Integration
  describe('Overview Page Integration', () => {
    const mockOverviewPayload: PipelineListResponse = {
      items: [],
      summary: {
        totalPipelines: 4,
        successful: 1,
        failed: 2,
        running: 1,
        canceled: 0,
        pending: 0,
        skipped: 0,
        successRate: 33.3,
        avgDurationSeconds: 417,
      },
      recentPipelines: [
        {
          id: 489224,
          status: 'running',
          projectId: 'atlas-api',
          projectName: 'Atlas API',
          ref: 'main',
          startedAt: '2026-10-09T01:52:35Z',
          durationSeconds: null,
          commitSha: '9f2a71d80b67e3a241e57cc4358a43612cf8e710',
          commitTitle: 'refactor(auth): migrate JWT token validation to JWKS cache store',
        },
      ],
      recentFailures: [
        {
          pipeline: {
            id: 489223,
            status: 'failed',
            projectId: 'polaris-platform',
            projectName: 'Polaris Platform',
            ref: 'feature/polaris-batch-v3',
            startedAt: '2026-10-09T01:10:20Z',
            durationSeconds: 502,
          },
          failedJob: {
            id: 10884,
            pipelineId: 489223,
            projectId: 'polaris-platform',
            projectName: 'Polaris Platform',
            name: 'integration-tests-distributed',
            stage: 'test',
            status: 'failed',
            startedAt: '2026-10-09T01:15:25Z',
            finishedAt: '2026-10-09T01:18:42Z',
            durationSeconds: 197,
            failureMessage: 'TestChunkPartitionRebalance: timeout signal',
          },
        },
      ],
      pagination: { page: 1, pageSize: 10, totalItems: 4, totalPages: 1 },
    };

    it('renders loading skeleton and then populates summary cards, recent failures, and recent pipelines', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockOverviewPayload), { status: 200 })
      );

      render(
        <MemoryRouter initialEntries={['/']}>
          <OverviewPage />
        </MemoryRouter>
      );

      // Loading is rendered initially
      expect(screen.getByText(/Pipeline Overview/i)).toBeInTheDocument();

      // Wait for populated content
      await waitFor(() => {
        expect(screen.getByText('Total Pipelines')).toBeInTheDocument();
      });

      // Metric card numbers from backend summary
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('2')).toBeInTheDocument();

      // Recent failure details
      expect(screen.getByText('Recent Failures (1)')).toBeInTheDocument();
      expect(screen.getByText(/integration-tests-distributed/i)).toBeInTheDocument();

      // Recent pipeline table
      expect(screen.getByText('#489224')).toBeInTheDocument();
      expect(screen.getByText('Atlas API')).toBeInTheDocument();
    });

    it('renders retryable error banner when backend request fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error loading overview'));

      render(
        <MemoryRouter initialEntries={['/']}>
          <OverviewPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error loading overview/i)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  // 9. Pipelines Page Integration (Filter, Sort, Pagination)
  describe('Pipelines Page Integration', () => {
    const mockPipelinesPayload: PipelineListResponse = {
      items: [
        {
          id: 489224,
          projectId: 'atlas-api',
          projectName: 'Atlas API',
          projectPath: 'atlas-platform/atlas-api',
          ref: 'main',
          commitSha: '9f2a71d80b67e3a241e57cc4358a43612cf8e710',
          commitShortSha: '9f2a71d8',
          commitTitle: 'refactor(auth): migrate JWT token validation to JWKS cache store',
          commitAuthor: 'Elena Rostova',
          status: 'running',
          source: 'push',
          user: { id: 104, name: 'Elena Rostova', username: 'erostova' },
          createdAt: '2026-10-09T01:52:10Z',
          startedAt: '2026-10-09T01:52:35Z',
          finishedAt: null,
          durationSeconds: null,
          stageCount: 5,
          jobCount: 9,
          failedJobCount: 0,
        },
      ],
      summary: {
        totalPipelines: 1,
        successful: 0,
        failed: 0,
        running: 1,
        canceled: 0,
        pending: 0,
        skipped: 0,
        successRate: 0,
        avgDurationSeconds: 0,
      },
      recentPipelines: [],
      recentFailures: [],
      pagination: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    };

    it('renders pipeline table and pagination controls', async () => {
      vi.spyOn(globalThis, 'fetch')
        // Projects metadata request
        .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }))
        // Pipelines request
        .mockResolvedValueOnce(new Response(JSON.stringify(mockPipelinesPayload), { status: 200 }));

      render(
        <MemoryRouter initialEntries={['/pipelines']}>
          <PipelinesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('#489224')).toBeInTheDocument();
        expect(screen.getByText('Atlas API')).toBeInTheDocument();
      });

      // Check pagination text and controls
      expect(screen.getByText(/Showing/i)).toBeInTheDocument();
      expect(screen.getByText('Per page:')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('renders EmptyState when zero pipelines match search criteria', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              items: [],
              summary: {},
              recentPipelines: [],
              recentFailures: [],
              pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
            }),
            { status: 200 }
          )
        );

      render(
        <MemoryRouter initialEntries={['/pipelines?search=nonexistent']}>
          <PipelinesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No matching pipelines/i)).toBeInTheDocument();
      });
    });
  });

  // 10. Pipeline Details Page Integration
  describe('Pipeline Details Route Integration', () => {
    const mockDetailPayload: PipelineDetail = {
      id: 489223,
      projectId: 'polaris-platform',
      projectName: 'Polaris Platform',
      projectPath: 'polaris-cloud/polaris-platform',
      ref: 'feature/polaris-batch-v3',
      commitSha: 'c4e82b79a1f26488d01bfa82947e62a03429dd11',
      commitShortSha: 'c4e82b79',
      commitTitle: 'feat(orchestrator): add parallel DAG chunking',
      commitAuthor: 'Marcus Chen',
      status: 'failed',
      source: 'merge_request_event',
      user: { id: 108, name: 'Marcus Chen', username: 'mchen' },
      createdAt: '2026-10-09T01:10:04Z',
      startedAt: '2026-10-09T01:10:20Z',
      finishedAt: '2026-10-09T01:18:42Z',
      durationSeconds: 502,
      stageCount: 3,
      jobCount: 3,
      failedJobCount: 1,
      webUrl: 'https://gitlab.example.com/polaris/pipelines/489223',
      stages: [
        {
          name: 'build',
          status: 'success',
          order: 1,
          totalJobs: 1,
          passedJobs: 1,
          failedJobs: 0,
          durationSeconds: 90,
          jobs: [
            {
              id: 10882,
              pipelineId: 489223,
              projectId: 'polaris-platform',
              projectName: 'Polaris Platform',
              name: 'build-dag-orchestrator',
              stage: 'build',
              status: 'success',
              startedAt: '2026-10-09T01:11:10Z',
              finishedAt: '2026-10-09T01:12:40Z',
              durationSeconds: 90,
            },
          ],
        },
        {
          name: 'test',
          status: 'failed',
          order: 2,
          totalJobs: 1,
          passedJobs: 0,
          failedJobs: 1,
          durationSeconds: 197,
          jobs: [
            {
              id: 10884,
              pipelineId: 489223,
              projectId: 'polaris-platform',
              projectName: 'Polaris Platform',
              name: 'integration-tests-distributed',
              stage: 'test',
              status: 'failed',
              startedAt: '2026-10-09T01:15:25Z',
              finishedAt: '2026-10-09T01:18:42Z',
              durationSeconds: 197,
              failureMessage: 'TestChunkPartitionRebalance: timeout signal',
            },
          ],
        },
      ],
    };

    it('renders pipeline metadata, stages, jobs, and genuine GitLab URL', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockDetailPayload), { status: 200 })
      );

      render(
        <MemoryRouter initialEntries={['/pipelines/489223']}>
          <Routes>
            <Route path="/pipelines/:pipelineId" element={<PipelineDetailsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pipeline #489223/i)).toBeInTheDocument();
        expect(screen.getByText('Polaris Platform')).toBeInTheDocument();
        expect(screen.getByText(/Stages and Jobs \(2 stages\)/i)).toBeInTheDocument();
        expect(screen.getByText('integration-tests-distributed')).toBeInTheDocument();
        expect(screen.getByText(/TestChunkPartitionRebalance: timeout signal/i)).toBeInTheDocument();
      });

      // GitLab link is rendered with href
      const gitLabLink = screen.getByRole('link', { name: /Open in GitLab/i });
      expect(gitLabLink).toHaveAttribute('href', 'https://gitlab.example.com/polaris/pipelines/489223');
    });

    it('renders 404 EmptyState when pipeline does not exist', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 'pipeline_not_found', message: 'Pipeline 999999 was not found.' },
          }),
          { status: 404 }
        )
      );

      render(
        <MemoryRouter initialEntries={['/pipelines/999999']}>
          <Routes>
            <Route path="/pipelines/:pipelineId" element={<PipelineDetailsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pipeline #999999 Not Found/i)).toBeInTheDocument();
      });
    });
  });

  // 11. Projects Page Integration
  describe('Projects Page Integration', () => {
    const mockProjectsPayload: ProjectsResponse = {
      items: [
        {
          id: 'atlas-api',
          name: 'Atlas API',
          path: 'atlas-platform/atlas-api',
          product: 'Core Cloud Platform',
          releaseStream: 'v2.8-mainline',
          solutionType: 'REST & GraphQL Microservice',
          infrastructureType: 'AWS EKS (Kubernetes 1.30)',
          deploymentType: 'Blue-Green Deployment',
          defaultBranch: 'main',
          description: 'High-throughput identity and routing gateway.',
          stats: {
            totalPipelines: 1,
            successCount: 0,
            failedCount: 0,
            runningCount: 1,
            successRate: 0,
            avgDurationSeconds: 0,
            latestPipeline: {
              id: 489224,
              status: 'running',
              startedAt: '2026-10-09T01:52:35Z',
              ref: 'main',
            },
          },
        },
        {
          id: 'orion-services',
          name: 'Orion Services',
          path: 'orion-mesh/orion-services',
          product: 'Event Broker Engine',
          releaseStream: 'v1.14-stable-lts',
          solutionType: 'Kafka Event Consumer',
          infrastructureType: 'GCP GKE Autopilot',
          deploymentType: 'Rolling Update',
          defaultBranch: 'master',
          description: 'Asynchronous event stream processor.',
          stats: null, // Project with no pipeline statistics
        },
      ],
    };

    it('renders projects and handles both populated stats and null stats gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockProjectsPayload), { status: 200 })
      );

      render(
        <MemoryRouter initialEntries={['/projects']}>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Atlas API')).toBeInTheDocument();
        expect(screen.getByText('Orion Services')).toBeInTheDocument();
      });

      // Total pipelines for atlas-api is 1, and for orion-services (null stats) is 0
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();

      // View Pipelines buttons are clickable
      const buttons = screen.getAllByRole('button', { name: /View Pipelines/i });
      expect(buttons.length).toBe(2);
    });
  });
});
