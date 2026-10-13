import { apiClient } from './apiClient';
import {
  Pipeline,
  PipelineListResponse,
  PipelineStatus,
} from '../types/pipeline';
import { PipelineDetail, PipelineStageGroup } from '../types/job';

export interface PipelineFilters {
  search?: string;
  projectId?: string;
  ref?: string;
  status?: PipelineStatus | 'all';
  /**
   * Reserved prototype filter.
   * Note: As documented in API_CONTRACT.md, dateRange is not supported by the backend
   * contract and is intentionally omitted from backend query parameters.
   */
  dateRange?: string;
  sortBy?: 'startedAt' | 'durationSeconds' | 'id';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const pipelineService = {
  /**
   * Fetches paginated pipelines matching filters from GET /api/v1/pipelines
   */
  async getPipelines(filters?: PipelineFilters): Promise<PipelineListResponse> {
    const params: Record<string, string | number | undefined> = {};

    if (filters?.search && filters.search.trim() !== '') {
      params.search = filters.search.trim();
    }
    if (filters?.projectId && filters.projectId !== 'all') {
      params.project = filters.projectId;
    }
    if (filters?.ref && filters.ref !== 'all') {
      params.ref = filters.ref;
    }
    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters?.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters?.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }
    if (filters?.page) {
      params.page = filters.page;
    }
    if (filters?.pageSize) {
      params.pageSize = filters.pageSize;
    }

    return apiClient.get<PipelineListResponse>('/pipelines', params);
  },

  /**
   * Fetches full pipeline details including stage and job hierarchy from GET /api/v1/pipelines/{pipeline_id}
   */
  async getPipelineById(id: number): Promise<PipelineDetail> {
    return apiClient.get<PipelineDetail>(`/pipelines/${id}`);
  },

  /**
   * Fetches overview data (summary metrics, recent pipelines, and recent failures)
   */
  async getOverviewData(): Promise<PipelineListResponse> {
    return apiClient.get<PipelineListResponse>('/pipelines', { pageSize: 10 });
  },

  /**
   * Helper to retrieve stage groups for a given pipeline
   */
  async getStageGroups(pipelineId: number): Promise<PipelineStageGroup[]> {
    const detail = await this.getPipelineById(pipelineId);
    return detail.stages || [];
  },
};
