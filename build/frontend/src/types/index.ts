export type PipelineStatus = 'Pending' | 'Running' | 'Success' | 'Failed' | 'Canceled';
export type SigningStatus = 'Not Started' | 'Running' | 'Success' | 'Failed';
export type RepackagingStatus = 'Not Started' | 'Running' | 'Success' | 'Failed';
export type Tag = 'Stable' | 'Released';

export type UserRole = 'Developer' | 'QA' | 'Release Engineer';

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  gitlabUrl: string;
}

export interface Branch {
  id: string;
  name: string;
  productId: string;
  isDefault?: boolean;
  lastCommitSha?: string;
  lastCommitTime?: string;
}

export type CheckStatus = 'Passed' | 'Failed' | 'Pending' | 'Not Checked';

export interface Commit {
  id: string;
  sha: string;
  shortSha: string;
  productId: string;
  branch: string;
  message: string;
  authorName: string;
  authorEmail: string;
  timestamp: string; // ISO string
  buildId?: string;
  version?: string;
  pipelineId?: string;
  pipelineStatus?: PipelineStatus;
  tags?: Tag[];
  signingStatus?: SigningStatus;
  repackagingStatus?: RepackagingStatus;
  gitlabUrl?: string;
}

export interface Build {
  id: string;
  commitSha: string;
  shortSha: string;
  productId: string;
  branch: string;
  version: string;
  status: PipelineStatus;
  triggeredBy: string;
  triggeredAt: string;
  pipelineId: string;
  durationSeconds?: number;
  mandatoryJobsPassed?: boolean;
  artifactsExist?: boolean;
}

export interface Pipeline {
  id: string;
  buildId: string;
  gitlabUrl: string;
  status: PipelineStatus;
  duration?: string;
  stages?: {
    name: string;
    status: PipelineStatus;
  }[];
}

export interface StableRecord {
  id: string;
  productId: string;
  branch: string;
  version: string;
  commitSha: string;
  shortSha: string;
  promotedBy: string;
  promotedAt: string;
  result: 'Success' | 'Failed';
  reason?: string;
  isCurrent?: boolean;
  isPrevious?: boolean;
}

export interface ReleaseRecord {
  id: string;
  productId: string;
  branch: string;
  version: string;
  sourceStableBuildId: string;
  releaseStatus: PipelineStatus;
  signingStatus: SigningStatus;
  repackagingStatus: RepackagingStatus;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryAllowed?: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'Build' | 'Promote Stable' | 'Release';
  product: string;
  branch: string;
  commit: string;
  version: string;
  outcome: 'Success' | 'Failed' | 'In Progress';
}

export interface EligibilityCheck {
  id: string;
  title: string;
  status: CheckStatus;
  passed: boolean;
  reason: string;
}

export interface CommitFilterParams {
  productId: string;
  branch: string;
  query?: string;
  status?: PipelineStatus | 'All';
  tag?: Tag | 'All';
  dateRange?: string; // 'all' | 'today' | '7d' | '30d'
}

export interface ActivityFilterParams {
  product?: string;
  branch?: string;
  action?: 'All' | 'Build' | 'Promote Stable' | 'Release';
  status?: 'All' | 'Success' | 'Failed' | 'In Progress';
  query?: string;
  dateRange?: string;
}
