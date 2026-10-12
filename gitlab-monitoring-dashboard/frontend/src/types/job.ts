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
  durationSeconds: number;
  runnerName?: string;
  runnerTags?: string[];
  failureMessage?: string;
  failureExitCode?: number;
  allowFailure?: boolean;
  webUrl?: string;
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
