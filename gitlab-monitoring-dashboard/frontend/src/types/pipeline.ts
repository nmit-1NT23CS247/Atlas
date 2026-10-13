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

import { Job } from './job';

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
  durationSeconds: number | null;
  stageCount: number;
  jobCount: number;
  failedJobCount: number;
  webUrl?: string | null;
  mergeRequestId?: number | null;
  mergeRequestIid?: number | null;
  coverage?: string | null;
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

export interface RecentPipeline {
  id: number;
  status: PipelineStatus;
  projectId: string;
  projectName: string;
  ref: string;
  startedAt: string;
  durationSeconds: number | null;
  commitSha?: string | null;
  commitTitle?: string | null;
}

export interface RecentFailure {
  pipeline: RecentPipeline;
  failedJob?: Job | null;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PipelineListResponse {
  items: Pipeline[];
  summary: PipelineSummaryMetrics;
  recentPipelines: RecentPipeline[];
  recentFailures: RecentFailure[];
  pagination: PaginationMetadata;
}
