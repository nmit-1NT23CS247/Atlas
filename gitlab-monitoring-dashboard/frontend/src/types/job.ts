export type JobStatus =
  | 'success'
  | 'failed'
  | 'running'
  | 'canceled'
  | 'pending'
  | 'skipped'
  | 'manual';

export type StageName =
  | 'prepare'
  | 'build'
  | 'test'
  | 'security'
  | 'package'
  | 'deploy';

import { Pipeline } from './pipeline';

export interface Job {
  id: number;
  pipelineId: number;
  projectId: string;
  projectName: string;
  name: string;
  stage: StageName;
  status: JobStatus;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  runnerName?: string | null;
  runnerTags?: string[] | null;
  failureMessage?: string | null;
  failureExitCode?: number | null;
  allowFailure?: boolean | null;
  webUrl?: string | null;
}

export interface PipelineStageGroup {
  name: StageName;
  status: JobStatus;
  order: number;
  jobs: Job[];
  totalJobs: number;
  passedJobs: number;
  failedJobs: number;
  durationSeconds: number;
}

export interface PipelineDetail extends Pipeline {
  stages: PipelineStageGroup[];
}
