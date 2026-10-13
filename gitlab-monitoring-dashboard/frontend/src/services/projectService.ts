import { apiClient } from './apiClient';
import {
  Project,
  ProjectWithStats,
  ProjectsResponse,
  ProjectStats,
} from '../types/project';

export const projectService = {
  /**
   * Fetches projects from GET /api/v1/projects with optional includeStats parameter
   */
  async getProjects(includeStats = true): Promise<ProjectWithStats[]> {
    const response = await apiClient.get<ProjectsResponse>('/projects', {
      includeStats,
    });
    return response.items;
  },

  /**
   * Convenience adapter returning ProjectStats[] matching legacy interface
   */
  async getProjectStats(): Promise<ProjectStats[]> {
    const items = await this.getProjects(true);
    return items.map((item) => ({
      project: {
        id: item.id,
        name: item.name,
        path: item.path,
        product: item.product,
        releaseStream: item.releaseStream,
        solutionType: item.solutionType,
        infrastructureType: item.infrastructureType,
        deploymentType: item.deploymentType,
        defaultBranch: item.defaultBranch,
        description: item.description,
      },
      totalPipelines: item.stats?.totalPipelines ?? 0,
      successCount: item.stats?.successCount ?? 0,
      failedCount: item.stats?.failedCount ?? 0,
      runningCount: item.stats?.runningCount ?? 0,
      successRate: item.stats?.successRate ?? 0,
      avgDurationSeconds: item.stats?.avgDurationSeconds ?? 0,
      latestPipeline: item.stats?.latestPipeline ?? null,
    }));
  },

  /**
   * Fetches a single project by ID
   */
  async getProjectById(id: string): Promise<ProjectWithStats | undefined> {
    const projects = await this.getProjects(false);
    return projects.find((p) => p.id === id);
  },
};
