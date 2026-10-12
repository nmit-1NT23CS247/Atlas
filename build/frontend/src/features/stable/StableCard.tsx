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
      className={`p-5 rounded-2xl bg-white border transition-all duration-150 ${
        isCurrent
          ? 'border-[#8E54E9]/30 shadow-[0_4px_16px_rgba(142,84,233,0.08)] ring-1 ring-[#8E54E9]/10'
          : 'border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isCurrent ? 'bg-[#F4F1FA] text-[#8E54E9]' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isCurrent ? <ShieldCheck className="w-4 h-4" /> : <History className="w-4 h-4" />}
          </div>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            {title}
          </span>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            isCurrent
              ? 'bg-[#F4F1FA] text-[#8E54E9] border border-[#8E54E9]/20'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {isCurrent ? 'Active Baseline' : 'Superseded'}
        </span>
      </div>

      {record ? (
        <div className="space-y-3">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Version</div>
            <div
              className={`text-sm font-bold font-mono mt-0.5 truncate ${
                isCurrent ? 'text-[#8E54E9]' : 'text-slate-800'
              }`}
            >
              {record.version}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span
              className="flex items-center gap-1 tabular-nums"
              title={formatDateTime(record.promotedAt)}
            >
              <Clock className="w-3 h-3" />
              {formatRelativeTime(record.promotedAt)}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {record.result}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          No {type} stable build recorded on {branchName}
        </div>
      )}
    </div>
  );
}
