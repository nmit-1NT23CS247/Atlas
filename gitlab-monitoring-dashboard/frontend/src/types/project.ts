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

export interface ProjectStats {
  project: Project;
  totalPipelines: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  successRate: number;
  avgDurationSeconds: number;
  latestPipeline?: {
    id: number;
    status: 'success' | 'failed' | 'running' | 'canceled' | 'pending' | 'skipped';
    startedAt: string;
    ref: string;
  };
}
