import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Hammer, ShieldCheck, Rocket, User } from 'lucide-react';
import { AuditEntry } from '../../types/index.ts';
import { formatRelativeTime } from '../../utils/formatters.ts';

export function RecentActivityList({ activities }: { activities: AuditEntry[] }) {
  const recent = activities.slice(0, 5);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Build':
        return <Hammer className="w-3.5 h-3.5 text-blue-500" />;
      case 'Promote Stable':
        return <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />;
      case 'Release':
        return <Rocket className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Hammer className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Success':
        return (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            Success
          </span>
        );
      case 'Failed':
        return (
          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
            Failed
          </span>
        );
      case 'In Progress':
      default:
        return (
          <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">
            In Progress
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="divide-y divide-slate-100">
        {recent.map((entry) => (
          <div
            key={entry.id}
            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-[#F4F1FA] shrink-0">
                {getActionIcon(entry.action)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{entry.action}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-slate-600 truncate">{entry.version}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {entry.user}
                  </span>
                  <span>·</span>
                  <span>{entry.branch}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(entry.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">{getOutcomeBadge(entry.outcome)}</div>
          </div>
        ))}
      </div>

      <div className="pt-2 text-right">
        <Link
          to="/activity"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline"
        >
          <span>View all activity</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
