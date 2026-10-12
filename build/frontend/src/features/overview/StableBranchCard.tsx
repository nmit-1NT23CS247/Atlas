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
    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)] flex flex-col justify-between hover:border-[#8E54E9]/30 transition-all duration-150">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#F4F1FA] text-[#8E54E9]">
              <GitBranch className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-slate-800">{branchName}</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8E54E9] bg-[#F4F1FA] px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Current Stable
          </span>
        </div>

        {stableRecord ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 font-medium">Version</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">
                {stableRecord.version}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Commit</span>
                <CommitLink sha={stableRecord.commitSha} />
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Promoted By</span>
                <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  {stableRecord.promotedBy}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No stable promotion recorded for this branch yet
          </div>
        )}
      </div>

      {stableRecord && (
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Promoted {formatRelativeTime(stableRecord.promotedAt)}
          </span>
          <span className="text-emerald-600 font-medium">Gate Verified</span>
        </div>
      )}
    </div>
  );
}
