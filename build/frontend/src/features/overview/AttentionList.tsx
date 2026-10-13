import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { CommitLink } from '../../components/common/CommitLink.tsx';
import { formatRelativeTime } from '../../utils/formatters.ts';

export interface AttentionItem {
  id: string;
  type: 'build' | 'release';
  title: string;
  subtitle: string;
  reason: string;
  timestamp: string;
  branch?: string;
  commitSha?: string;
  version?: string;
  linkTo: string;
  actionLabel: string;
  retryAllowed?: boolean;
}

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">
            All pipelines nominal. No failed stages or blocked workflows require attention.
          </span>
        </div>
        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
          0 Blockers
        </span>
      </div>
    );
  }

  // Helper to extract plain-English explanation vs technical log detail
  const formatFailure = (reason: string) => {
    if (reason.includes('Package manifest checksum mismatch')) {
      return {
        summary: 'Package manifest checksum mismatch during RPM repackaging wrap-up.',
        detail: reason,
      };
    }
    if (reason.includes('failed validation tests')) {
      return {
        summary: 'Pipeline automated validation test suite failed.',
        detail: reason,
      };
    }
    return {
      summary: reason,
      detail: reason,
    };
  };

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const failure = formatFailure(item.reason);
        const isExpanded = expandedId === item.id;
        const hasExtraDetail = failure.detail !== failure.summary;

        return (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs text-xs space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{item.title}</span>
                    {item.version && (
                      <span className="font-mono text-[#7C3AED] bg-[#F4F1FA] px-1.5 py-0.5 rounded text-[11px] font-medium">
                        {item.version}
                      </span>
                    )}
                    {item.branch && (
                      <span className="text-slate-500 font-medium">· {item.branch}</span>
                    )}
                    <span className="text-slate-400">· {formatRelativeTime(item.timestamp)}</span>
                  </div>

                  {/* Plain-English summary first */}
                  <p className="text-rose-800 mt-1 font-medium leading-relaxed">
                    {failure.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {item.commitSha && <CommitLink sha={item.commitSha} />}
                <Link
                  to={item.linkTo}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Technical detail on demand */}
            {hasExtraDetail && (
              <div className="pt-2 border-t border-rose-100/70 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer self-start font-medium"
                >
                  <span>{isExpanded ? 'Hide technical error details' : 'Show technical error details'}</span>
                </button>
                {isExpanded && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-rose-700 leading-relaxed break-all select-text">
                    {failure.detail}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
