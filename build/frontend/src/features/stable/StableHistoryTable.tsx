import React, { useState } from 'react';
import { CheckCircle2, User } from 'lucide-react';
import { StableRecord } from '../../types/index.ts';
import { CommitLink } from '../../components/common/CommitLink.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TablePagination } from '../../components/ui/Table.tsx';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters.ts';

export function StableHistoryTable({
  records,
}: {
  records: StableRecord[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const totalPages = Math.ceil(records.length / pageSize);
  const paginated = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Stable Promotion History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of gate promotions and baseline shifts
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400 tabular-nums">
          {records.length} Total Promotions
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F4F1FA]/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Commit</th>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Promoted By</th>
              <th className="py-3 px-4">Promotion Time</th>
              <th className="py-3 px-4">Gate Status</th>
              <th className="py-3 px-4">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    title="No stable promotions found"
                    description="No stable promotion events have been recorded for this product or branch selection."
                    className="border-0 rounded-none py-12"
                  />
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <span className="text-[#7C3AED] bg-[#F4F1FA] border border-[#7C3AED]/20 px-2.5 py-1 rounded-md">
                      {r.version}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommitLink sha={r.commitSha} />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {r.branch}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {r.promotedBy}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                    <span
                      className="tabular-nums"
                      title={formatDateTime(r.promotedAt)}
                    >
                      {formatRelativeTime(r.promotedAt)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {r.isCurrent ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Current Stable
                      </span>
                    ) : r.isPrevious ? (
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Previous Stable
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Archived</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {r.result}
                    </span>
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
        totalItems={records.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
