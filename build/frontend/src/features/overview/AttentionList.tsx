import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, RefreshCw, Hammer, Rocket } from 'lucide-react';
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
  if (items.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/50 text-xs text-emerald-800 flex items-center justify-between">
        <span className="font-medium">
          All active builds, signing stages, and packaging jobs are nominal. No failures require attention.
        </span>
        <span className="text-[11px] text-emerald-600 font-mono">0 blocking issues</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-3.5 rounded-xl bg-white border border-rose-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">{item.title}</span>
                {item.version && (
                  <span className="font-mono text-[#8E54E9] bg-[#F4F1FA] px-1.5 py-0.2 rounded text-[11px]">
                    {item.version}
                  </span>
                )}
                {item.branch && (
                  <span className="text-slate-400 font-medium">· {item.branch}</span>
                )}
                <span className="text-slate-400">· {formatRelativeTime(item.timestamp)}</span>
              </div>

              <p className="text-rose-700 mt-1 font-mono text-[11px] leading-relaxed break-all">
                {item.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {item.commitSha && <CommitLink sha={item.commitSha} />}
            <Link
              to={item.linkTo}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <span>{item.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
