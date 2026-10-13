export interface Project {
  id: string;
  name: string;
  path: string;
  product: string;
  releaseStream: string;
  solutionType: string;
  infrastructureType: string;
  deploymentType: string;
  defaultBranch: string;
  description: string;
}

export interface LatestPipeline {
  id: number;
  status: 'success' | 'failed' | 'running' | 'canceled' | 'pending' | 'skipped';
  startedAt: string;
  ref: string;
}

export interface ProjectStatsSummary {
  totalPipelines: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  successRate: number;
  avgDurationSeconds: number;
  latestPipeline: LatestPipeline | null;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStatsSummary | null;
}

export interface ProjectsResponse {
  items: ProjectWithStats[];
}

export interface ProjectStats {
  project: Project;
  totalPipelines: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  successRate: number;
  avgDurationSeconds: number;
  latestPipeline?: LatestPipeline | null;
}
