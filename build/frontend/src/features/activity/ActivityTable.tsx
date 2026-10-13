import React, { useState } from 'react';
import {
  Hammer,
  ShieldCheck,
  Rocket,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { AuditEntry } from '../../types/index.ts';
import { TablePagination } from '../../components/ui/Table.tsx';
import { CommitLink } from '../../components/common/CommitLink.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters.ts';

export function ActivityTable({ activities }: { activities: AuditEntry[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const totalPages = Math.ceil(activities.length / pageSize);
  const paginated = activities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Build':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <Hammer className="w-3.5 h-3.5" />
            Build Trigger
          </span>
        );
      case 'Promote Stable':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] bg-[#F4F1FA] px-2.5 py-1 rounded-full border border-[#7C3AED]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Promote Stable
          </span>
        );
      case 'Release':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Rocket className="w-3.5 h-3.5" />
            Release Build
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            {action}
          </span>
        );
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Success
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed
          </span>
        );
      case 'In Progress':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            In Progress
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F4F1FA]/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-3 px-4">Event Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Commit</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4 text-right">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <EmptyState
                    title="No activity log entries found"
                    description="No audit events match your active filters. Try clearing search filters or broadening your date selection."
                    className="border-0 rounded-none py-12"
                  />
                </td>
              </tr>
            ) : (
              paginated.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                    <span
                      className="tabular-nums font-mono"
                      title={formatDateTime(entry.timestamp)}
                    >
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </td>

                  {/* User */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {entry.user}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getActionBadge(entry.action)}
                  </td>

                  {/* Product */}
                  <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    {entry.product}
                  </td>

                  {/* Branch */}
                  <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                    {entry.branch}
                  </td>

                  {/* Commit */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommitLink sha={entry.commit} />
                  </td>

                  {/* Version */}
                  <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                    <span className="text-[#7C3AED] bg-[#F4F1FA] border border-[#7C3AED]/20 px-2 py-0.5 rounded-md">
                      {entry.version}
                    </span>
                  </td>

                  {/* Outcome */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {getOutcomeBadge(entry.outcome)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={activities.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
