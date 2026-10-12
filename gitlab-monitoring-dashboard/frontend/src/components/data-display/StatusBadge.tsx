import React from 'react';
import { PipelineStatus } from '../../types/pipeline';
import { JobStatus } from '../../types/job';
import { STATUS_CONFIG } from '../../lib/constants';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Ban,
  Clock,
  FastForward,
  PlayCircle,
} from 'lucide-react';

export interface StatusBadgeProps {
  status: PipelineStatus | JobStatus;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const renderIcon = () => {
    const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
    switch (status) {
      case 'success':
        return <CheckCircle2 className={`${iconSize} text-emerald-600 shrink-0`} />;
      case 'failed':
        return <XCircle className={`${iconSize} text-rose-600 shrink-0`} />;
      case 'running':
        return <Loader2 className={`${iconSize} text-blue-600 animate-spin shrink-0`} />;
      case 'canceled':
        return <Ban className={`${iconSize} text-slate-500 shrink-0`} />;
      case 'pending':
        return <Clock className={`${iconSize} text-amber-600 shrink-0`} />;
      case 'skipped':
        return <FastForward className={`${iconSize} text-slate-400 shrink-0`} />;
      case 'manual':
        return <PlayCircle className={`${iconSize} text-purple-600 shrink-0`} />;
      default:
        return <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />;
    }
  };

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses} whitespace-nowrap`}
    >
      {showIcon && renderIcon()}
      <span>{config.label}</span>
    </span>
  );
};
