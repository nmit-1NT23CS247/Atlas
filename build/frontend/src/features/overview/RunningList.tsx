import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { CommitLink, PipelineLink } from '../../components/common/CommitLink.tsx';
import { formatRelativeTime } from '../../utils/formatters.ts';

export interface RunningItem {
  id: string;
  type: 'pipeline' | 'release';
  title: string;
  stageName: string;
  branch: string;
  version?: string;
  commitSha?: string;
  pipelineId?: string;
  startTime: string;
  linkTo: string;
}

export function RunningList({ items }: { items: RunningItem[] }) {
  if (items.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
        No background runner jobs or release pipelines are currently in flight.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">{item.title}</span>
                {item.version && (
                  <span className="font-mono text-[#8E54E9] bg-[#F4F1FA] px-1.5 py-0.2 rounded text-[11px]">
                    {item.version}
                  </span>
                )}
                <span className="text-slate-400 font-medium">· {item.branch}</span>
                <span className="text-slate-400">· Started {formatRelativeTime(item.startTime)}</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                  Stage: {item.stageName}
                </span>
                {item.pipelineId && (
                  <>
                    <span>·</span>
                    <PipelineLink pipelineId={item.pipelineId} />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {item.commitSha && <CommitLink sha={item.commitSha} />}
            <Link
              to={item.linkTo}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
