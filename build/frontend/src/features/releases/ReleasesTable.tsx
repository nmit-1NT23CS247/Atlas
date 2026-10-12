import React, { useState } from 'react';
import {
  Rocket,
  RefreshCw,
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { ReleaseRecord } from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { TablePagination } from '../../components/ui/Table.tsx';
import {
  PipelineStatusBadge,
  StepStatusBadge,
} from '../../components/common/StatusBadge.tsx';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters.ts';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';

export interface ReleasesTableProps {
  releases: ReleaseRecord[];
  onRetry: (releaseId: string, step: 'signing' | 'repackaging') => Promise<void>;
}

export function ReleasesTable({ releases, onRetry }: ReleasesTableProps) {
  const { role, canCreateRelease, getRolePermissionReason } = useDashboard();
  const [currentPage, setCurrentPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const pageSize = 20;

  const totalPages = Math.ceil(releases.length / pageSize);
  const paginated = releases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRetryStep = async (releaseId: string, step: 'signing' | 'repackaging') => {
    try {
      setRetryingId(`${releaseId}-${step}`);
      await onRetry(releaseId, step);
    } finally {
      setRetryingId(null);
    }
  };

  const roleReason = getRolePermissionReason('release');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Release Build Pipeline Runs
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage progression for official production releases, signing, and repackaging
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400 tabular-nums">
          {releases.length} Total Releases
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F4F1FA]/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-3 px-4">Release Version</th>
              <th className="py-3 px-4">Source Stable</th>
              <th className="py-3 px-4">Release Status</th>
              <th className="py-3 px-4">Signing Status</th>
              <th className="py-3 px-4">Repackaging Status</th>
              <th className="py-3 px-4">Started By</th>
              <th className="py-3 px-4">Started Time</th>
              <th className="py-3 px-4 text-right">Failure Resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No releases created yet.
                </td>
              </tr>
            ) : (
              paginated.map((rel) => {
                const hasFailedStep =
                  rel.releaseStatus === 'Failed' ||
                  rel.signingStatus === 'Failed' ||
                  rel.repackagingStatus === 'Failed';

                const failedStepName: 'signing' | 'repackaging' | null =
                  rel.repackagingStatus === 'Failed'
                    ? 'repackaging'
                    : rel.signingStatus === 'Failed'
                    ? 'signing'
                    : null;

                const isRetrying = retryingId?.startsWith(rel.id);

                return (
                  <tr key={rel.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Version */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="text-[#8E54E9] bg-[#F4F1FA] px-2.5 py-1 rounded-md">
                        {rel.version}
                      </span>
                    </td>

                    {/* Source Stable */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {rel.sourceStableBuildId} ({rel.branch})
                    </td>

                    {/* Release Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PipelineStatusBadge status={rel.releaseStatus} />
                    </td>

                    {/* Signing Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StepStatusBadge status={rel.signingStatus} />
                    </td>

                    {/* Repackaging Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StepStatusBadge status={rel.repackagingStatus} />
                    </td>

                    {/* Started By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {rel.startedBy}
                      </span>
                    </td>

                    {/* Started Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <span
                        className="tabular-nums"
                        title={formatDateTime(rel.startedAt)}
                      >
                        {formatRelativeTime(rel.startedAt)}
                      </span>
                    </td>

                    {/* Failure Resolution */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {hasFailedStep && rel.errorMessage ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <div
                            className="max-w-[200px] text-[11px] text-rose-600 truncate font-mono"
                            title={rel.errorMessage}
                          >
                            {rel.errorMessage}
                          </div>
                          {rel.retryAllowed && failedStepName && (
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={isRetrying}
                              disabled={!canCreateRelease || isRetrying}
                              tooltip={
                                roleReason ||
                                `Retry failed ${failedStepName} stage on runner cluster`
                              }
                              onClick={() => handleRetryStep(rel.id, failedStepName)}
                              leftIcon={<RefreshCw className="w-3 h-3" />}
                              className="text-[11px] h-7 px-2.5"
                            >
                              Retry {failedStepName}
                            </Button>
                          )}
                        </div>
                      ) : rel.repackagingStatus === 'Success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready for Distribution
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={releases.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
