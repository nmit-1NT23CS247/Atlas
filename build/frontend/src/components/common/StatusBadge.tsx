import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Ban,
  ShieldCheck,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import {
  PipelineStatus,
  SigningStatus,
  RepackagingStatus,
  Tag,
} from '../../types/index.ts';

export function PipelineStatusBadge({ status }: { status?: PipelineStatus }) {
  if (!status) {
    return (
      <span className="text-xs text-slate-400 font-mono">No build</span>
    );
  }

  switch (status) {
    case 'Success':
      return (
        <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}>
          Success
        </Badge>
      );
    case 'Failed':
      return (
        <Badge variant="failed" icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}>
          Failed
        </Badge>
      );
    case 'Running':
      return (
        <Badge
          variant="running"
          icon={<Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
        >
          Running
        </Badge>
      );
    case 'Pending':
      return (
        <Badge variant="pending" icon={<Clock className="w-3.5 h-3.5 text-amber-600" />}>
          Pending
        </Badge>
      );
    case 'Canceled':
      return (
        <Badge variant="canceled" icon={<Ban className="w-3.5 h-3.5 text-slate-500" />}>
          Canceled
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function StepStatusBadge({
  status,
}: {
  status: SigningStatus | RepackagingStatus;
}) {
  switch (status) {
    case 'Success':
      return (
        <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}>
          Success
        </Badge>
      );
    case 'Failed':
      return (
        <Badge variant="failed" icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}>
          Failed
        </Badge>
      );
    case 'Running':
      return (
        <Badge
          variant="running"
          icon={<Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
        >
          Running
        </Badge>
      );
    case 'Not Started':
    default:
      return (
        <Badge variant="canceled" icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}>
          Not Started
        </Badge>
      );
  }
}

export function TagBadge({ tag }: { tag: Tag }) {
  if (tag === 'Stable') {
    return (
      <Badge
        variant="purple"
        size="sm"
        icon={<ShieldCheck className="w-3 h-3 text-[#8E54E9]" />}
      >
        Stable
      </Badge>
    );
  }
  if (tag === 'Released') {
    return (
      <Badge
        variant="success"
        size="sm"
        icon={<Sparkles className="w-3 h-3 text-emerald-600" />}
      >
        Released
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" size="sm" icon={<TagIcon className="w-3 h-3" />}>
      {tag}
    </Badge>
  );
}
