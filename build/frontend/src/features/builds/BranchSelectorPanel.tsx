import React from 'react';
import { GitBranch, Star, Clock } from 'lucide-react';
import { Branch } from '../../types/index.ts';
import { formatRelativeTime } from '../../utils/formatters.ts';

export interface BranchSelectorPanelProps {
  branches: Branch[];
  selectedBranch: string;
  onSelectBranch: (branchName: string) => void;
  isLoading?: boolean;
}

export function BranchSelectorPanel({
  branches,
  selectedBranch,
  onSelectBranch,
  isLoading,
}: BranchSelectorPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)] p-4 h-full flex flex-col">
      <div className="px-2 pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#8E54E9]" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Repository Branches
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
          {branches.length}
        </span>
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {branches.map((b) => {
          const isSelected = b.name === selectedBranch;

          return (
            <button
              key={b.id}
              onClick={() => onSelectBranch(b.name)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-150 cursor-pointer flex flex-col gap-1 border ${
                isSelected
                  ? 'bg-[#F4F1FA] border-[#8E54E9]/30 text-[#8E54E9] shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs tracking-tight truncate flex items-center gap-1.5">
                  <span className={isSelected ? 'text-[#8E54E9]' : 'text-slate-500'}>
                    {b.name}
                  </span>
                  {b.isDefault && (
                    <span
                      title="Default Branch"
                      className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.2 rounded-md font-medium"
                    >
                      default
                    </span>
                  )}
                </span>
              </div>

              {b.lastCommitTime && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatRelativeTime(b.lastCommitTime)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
