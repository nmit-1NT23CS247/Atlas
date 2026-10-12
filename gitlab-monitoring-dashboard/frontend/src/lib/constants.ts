import { PipelineStatus } from '../types/pipeline';
import { JobStatus, StageName } from '../types/job';

export const STAGE_ORDER: Record<StageName, number> = {
  prepare: 1,
  build: 2,
  test: 3,
  security: 4,
  package: 5,
  deploy: 6,
};

export const STAGE_DISPLAY_NAMES: Record<StageName, string> = {
  prepare: 'Prepare',
  build: 'Build',
  test: 'Test',
  security: 'Security',
  package: 'Package',
  deploy: 'Deploy',
};

export const STATUS_CONFIG: Record<
  PipelineStatus | JobStatus,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    iconName: 'check' | 'x' | 'loader' | 'slash' | 'clock' | 'fast-forward' | 'hand';
  }
> = {
  success: {
    label: 'Passed',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-600',
    iconName: 'check',
  },
  failed: {
    label: 'Failed',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-600',
    iconName: 'x',
  },
  running: {
    label: 'Running',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-600',
    iconName: 'loader',
  },
  canceled: {
    label: 'Canceled',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-500',
    iconName: 'slash',
  },
  pending: {
    label: 'Pending',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    iconName: 'clock',
  },
  skipped: {
    label: 'Skipped',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-500',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-400',
    iconName: 'fast-forward',
  },
  manual: {
    label: 'Manual',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500',
    iconName: 'hand',
  },
};
