import React, { useState } from 'react';
import { Pipeline } from '../../../types/pipeline';
import { Card } from '../../../components/ui/Card';
import { formatDateTime } from '../../../lib/date';
import { formatDuration, formatCommitSha, formatSourceLabel } from '../../../lib/formatters';
import { StatusBadge } from '../../../components/data-display/StatusBadge';
import { Copy, Check, GitCommit, GitBranch, User, Clock, Terminal } from 'lucide-react';

export interface PipelineMetadataProps {
  pipeline: Pipeline;
}

export const PipelineMetadata: React.FC<PipelineMetadataProps> = ({ pipeline }) => {
  const [copiedSha, setCopiedSha] = useState(false);

  const handleCopySha = () => {
    navigator.clipboard.writeText(pipeline.commitSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 1800);
  };

  return (
    <Card className="p-4 bg-white border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Project & Branch */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Project & Ref
          </span>
          <div className="font-semibold text-slate-900 text-sm">
            {pipeline.projectName}
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <GitBranch className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-mono">{pipeline.ref}</span>
          </div>
        </div>

        {/* Commit & Author */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Commit
          </span>
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono font-medium text-slate-800">
              {formatCommitSha(pipeline.commitSha, 10)}
            </span>
            <button
              onClick={handleCopySha}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
              title="Copy commit hash"
              aria-label="Copy commit hash"
            >
              {copiedSha ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 truncate" title={pipeline.commitTitle}>
            {pipeline.commitTitle}
          </p>
        </div>

        {/* Trigger Source & User */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Trigger
          </span>
          <div className="text-slate-800 font-medium">
            {formatSourceLabel(pipeline.source)}
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{pipeline.user.name}</span>
          </div>
        </div>

        {/* Execution Time & Duration */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Timing
          </span>
          <div className="flex items-center gap-1 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Duration: <strong className="font-mono text-slate-900">{formatDuration(pipeline.durationSeconds)}</strong></span>
          </div>
          <div className="text-[11px] text-slate-500">
            Started: {formatDateTime(pipeline.startedAt)}
          </div>
          {pipeline.finishedAt && (
            <div className="text-[11px] text-slate-500">
              Finished: {formatDateTime(pipeline.finishedAt)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
