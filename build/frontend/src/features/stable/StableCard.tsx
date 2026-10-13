import React from 'react';
import { ShieldCheck, History, Clock, User, CheckCircle2 } from 'lucide-react';
import { StableRecord } from '../../types/index.ts';
import { CommitLink } from '../../components/common/CommitLink.tsx';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters.ts';

export function StableCard({
  title,
  type,
  record,
  branchName,
}: {
  title: string;
  type: 'current' | 'previous';
  record?: StableRecord;
  branchName: string;
}) {
  const isCurrent = type === 'current';

  return (
    <div
      className={`p-5 rounded-2xl bg-white border transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
        isCurrent
          ? 'border-[#7C3AED]/30 ring-1 ring-[#7C3AED]/10'
          : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isCurrent ? 'bg-[#F4F1FA] text-[#7C3AED]' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isCurrent ? <ShieldCheck className="w-4 h-4" /> : <History className="w-4 h-4" />}
          </div>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
            {title}
          </span>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            isCurrent
              ? 'bg-[#F4F1FA] text-[#7C3AED] border border-[#7C3AED]/20'
              : 'bg-slate-50 text-slate-500 border border-slate-200'
          }`}
        >
          {isCurrent ? 'Active Baseline' : 'Previous Baseline'}
        </span>
      </div>

      {record ? (
        <div className="space-y-3">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Certified Version</div>
            <div
              className={`text-sm font-bold font-mono mt-0.5 truncate ${
                isCurrent ? 'text-[#7C3AED]' : 'text-slate-800'
              }`}
            >
              {record.version}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Commit</span>
              <CommitLink sha={record.commitSha} />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Promoted By</span>
              <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                {record.promotedBy}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span
              className="flex items-center gap-1 tabular-nums"
              title={formatDateTime(record.promotedAt)}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              {formatRelativeTime(record.promotedAt)}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Gate Verified
            </span>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          No {type} stable build recorded on branch <span className="font-mono">{branchName}</span>
        </div>
      )}
    </div>
  );
}
