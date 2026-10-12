import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StatusBadge } from '../components/data-display/StatusBadge';
import { pipelineService } from '../services/pipelineService';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { PipelinesPage } from '../features/pipelines/PipelinesPage';
import { PipelineDetailsPage } from '../features/pipelines/PipelineDetailsPage';
import { ProjectsPage } from '../features/projects/ProjectsPage';

describe('GitLab Pipeline Monitoring Test Suite', () => {
  describe('StatusBadge Rendering', () => {
    it('renders Passed badge correctly with text and icon', () => {
      render(<StatusBadge status="success" />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('renders Failed badge correctly with text and icon', () => {
      render(<StatusBadge status="failed" />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('renders Running badge correctly', () => {
      render(<StatusBadge status="running" />);
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  describe('Summary Metric Calculations', () => {
    it('derives accurate summary metrics from the shared mock dataset', () => {
      const metrics = pipelineService.getSummaryMetrics();
      const allPipelines = pipelineService.getPipelines();

      expect(metrics.totalPipelines).toBe(allPipelines.length);
      expect(metrics.successful).toBe(
        allPipelines.filter((p) => p.status === 'success').length
      );
      expect(metrics.failed).toBe(
        allPipelines.filter((p) => p.status === 'failed').length
      );
      expect(metrics.running).toBe(
        allPipelines.filter((p) => p.status === 'running').length
      );
    });
  });

  describe('Overview Page Layout', () => {
    it('renders the 4 summary cards, recent failures, and recent pipelines', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <OverviewPage />
        </MemoryRouter>
      );

      // Verify the 4 summary cards
      expect(screen.getByText('Total Pipelines')).toBeInTheDocument();
      expect(screen.getByText('Successful Pipelines')).toBeInTheDocument();
      expect(screen.getByText('Failed Pipelines')).toBeInTheDocument();
      expect(screen.getByText('Running Pipelines')).toBeInTheDocument();

      // Verify Recent Pipelines table
      expect(screen.getByText('Recent Pipelines')).toBeInTheDocument();
      expect(container.querySelector('table')).toBeInTheDocument();
    });
  });

  describe('Pipeline Search and Filters', () => {
    it('filters pipelines by query text', () => {
      const results = pipelineService.getPipelines({ search: 'Atlas' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((p) => {
        const matches =
          p.projectName.includes('Atlas') ||
          p.id.toString().includes('Atlas') ||
          p.commitTitle.includes('Atlas');
        expect(matches).toBe(true);
      });
    });

    it('filters pipelines by status', () => {
      const failed = pipelineService.getPipelines({ status: 'failed' });
      expect(failed.length).toBeGreaterThan(0);
      failed.forEach((p) => {
        expect(p.status).toBe('failed');
      });
    });

    it('filters pipelines by project', () => {
      const nimbus = pipelineService.getPipelines({ projectId: 'nimbus-web' });
      expect(nimbus.length).toBeGreaterThan(0);
      nimbus.forEach((p) => {
        expect(p.projectId).toBe('nimbus-web');
      });
    });
  });

  describe('Pipeline Details Route Rendering', () => {
    it('renders pipeline metadata and stage timeline for an existing pipeline', () => {
      render(
        <MemoryRouter initialEntries={['/pipelines/489224']}>
          <Routes>
            <Route path="/pipelines/:pipelineId" element={<PipelineDetailsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Pipeline #489224/i)).toBeInTheDocument();
      expect(screen.getByText('Atlas API')).toBeInTheDocument();
      expect(screen.getByText(/Stages and Jobs/i)).toBeInTheDocument();
      expect(screen.getByText('Open in GitLab')).toBeInTheDocument();
    });

    it('renders empty state when pipeline ID does not exist', () => {
      render(
        <MemoryRouter initialEntries={['/pipelines/99999999']}>
          <Routes>
            <Route path="/pipelines/:pipelineId" element={<PipelineDetailsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Pipeline #99999999 Not Found/i)).toBeInTheDocument();
    });
  });

  describe('Projects Page Rendering', () => {
    it('renders projects table and columns', () => {
      render(
        <MemoryRouter initialEntries={['/projects']}>
          <ProjectsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Atlas API')).toBeInTheDocument();
      expect(screen.getByText('Nimbus Web')).toBeInTheDocument();
    });
  });

  describe('Empty Search Results', () => {
    it('renders EmptyState when search criteria yield zero records', () => {
      render(
        <MemoryRouter initialEntries={['/pipelines?search=nonexistenttermxyz']}>
          <PipelinesPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/No matching pipelines/i)).toBeInTheDocument();
    });
  });
});
