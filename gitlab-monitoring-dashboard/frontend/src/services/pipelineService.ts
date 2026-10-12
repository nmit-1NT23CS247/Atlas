import { dataSource } from './dataSource';
import { Pipeline, PipelineStatus, PipelineSummaryMetrics } from '../types/pipeline';
import { Job, PipelineStageGroup } from '../types/job';

export interface PipelineFilters {
  search?: string;
  projectId?: string;
  ref?: string;
  status?: PipelineStatus | 'all';
  dateRange?: string; // Reserved for future server-side date filtering.
  sortBy?: 'startedAt' | 'durationSeconds' | 'id';
  sortOrder?: 'asc' | 'desc';
}

export const pipelineService = {
  getPipelines(filters?: PipelineFilters): Pipeline[] {
    let list = dataSource.getPipelines();

    if (!filters) {
      return list;
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          p.id.toString().includes(q) ||
          p.projectName.toLowerCase().includes(q) ||
          p.commitSha.toLowerCase().includes(q) ||
          p.commitTitle.toLowerCase().includes(q) ||
          p.commitAuthor.toLowerCase().includes(q) ||
          p.ref.toLowerCase().includes(q)
        );
      });
    }

    if (filters.projectId && filters.projectId !== 'all') {
      list = list.filter((p) => p.projectId === filters.projectId);
    }

    if (filters.ref && filters.ref !== 'all') {
      list = list.filter((p) => p.ref === filters.ref);
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      // The dataset uses fixed timestamps so prototype filtering is deterministic.
      const mockNow = new Date('2026-10-09T03:00:00Z').getTime();
      const hoursMap: Record<string, number> = {
        '24h': 24,
        '7d': 24 * 7,
        '14d': 24 * 14,
        '30d': 24 * 30,
      };
      const hours = hoursMap[filters.dateRange] || 24 * 7;
      const minTime = mockNow - hours * 60 * 60 * 1000;
      list = list.filter((p) => new Date(p.startedAt).getTime() >= minTime);
    }

    // Sorting
    const sortBy = filters.sortBy || 'startedAt';
    const sortOrder = filters.sortOrder || 'desc';

    list = [...list].sort((a, b) => {
      let valA: number | string = a.startedAt;
      let valB: number | string = b.startedAt;

      if (sortBy === 'durationSeconds') {
        valA = a.durationSeconds;
        valB = b.durationSeconds;
      } else if (sortBy === 'id') {
        valA = a.id;
        valB = b.id;
      } else {
        valA = new Date(a.startedAt).getTime();
        valB = new Date(b.startedAt).getTime();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });

    return list;
  },

  getPipelineById(id: number): Pipeline | undefined {
    return dataSource.getPipelineById(id);
  },

  getSummaryMetrics(): PipelineSummaryMetrics {
    return dataSource.getSummaryMetrics();
  },

  getRecentFailedPipelines(limit = 4) {
    return dataSource.getRecentFailedPipelines(limit);
  },

  getStageGroups(pipelineId: number): PipelineStageGroup[] {
    return dataSource.getStageGroupsForPipeline(pipelineId);
  },
};
