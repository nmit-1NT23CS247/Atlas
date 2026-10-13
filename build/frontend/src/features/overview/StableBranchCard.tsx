import React from 'react';
import { GitBranch, ShieldCheck, Clock, User } from 'lucide-react';
import { StableRecord } from '../../types/index.ts';
import { CommitLink } from '../../components/common/CommitLink.tsx';
import { formatRelativeTime } from '../../utils/formatters.ts';

export function StableBranchCard({
  branchName,
  stableRecord,
}: {
  branchName: string;
  stableRecord?: StableRecord;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-[#7C3AED]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-[#F4F1FA] text-[#7C3AED] shrink-0">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-xs">{branchName}</span>
            {stableRecord && (
              <span className="font-mono text-[#7C3AED] bg-[#F4F1FA] border border-[#7C3AED]/20 px-2 py-0.5 rounded text-[11px] font-bold">
                {stableRecord.version}
              </span>
            )}
          </div>
          {stableRecord ? (
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
              <span>Commit:</span>
              <CommitLink sha={stableRecord.commitSha} />
              <span>·</span>
              <span className="flex items-center gap-1 text-slate-600">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                {stableRecord.promotedBy}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                Promoted {formatRelativeTime(stableRecord.promotedAt)}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              No certified stable baseline currently recorded on this branch
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        {stableRecord ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Gate Verified Baseline
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
            No Baseline
          </span>
        )}
      </div>
    </div>
  );
}
