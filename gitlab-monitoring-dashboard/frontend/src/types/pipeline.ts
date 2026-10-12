export type PipelineStatus =
  | 'success'
  | 'failed'
  | 'running'
  | 'canceled'
  | 'pending'
  | 'skipped';

export type PipelineSource =
  | 'push'
  | 'merge_request_event'
  | 'schedule'
  | 'web'
  | 'api'
  | 'trigger';

export interface PipelineUser {
  id: number;
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface Pipeline {
  id: number;
  projectId: string;
  projectName: string;
  projectPath: string;
  ref: string;
  commitSha: string;
  commitShortSha: string;
  commitTitle: string;
  commitAuthor: string;
  status: PipelineStatus;
  source: PipelineSource;
  user: PipelineUser;
  createdAt: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number;
  stageCount: number;
  jobCount: number;
  failedJobCount: number;
  webUrl?: string;
  mergeRequestId?: number;
  mergeRequestIid?: number;
  coverage?: string;
}

export interface PipelineSummaryMetrics {
  totalPipelines: number;
  successful: number;
  failed: number;
  running: number;
  canceled: number;
  pending: number;
  skipped: number;
  successRate: number;
  avgDurationSeconds: number;
}
