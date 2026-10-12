import React, { useState } from 'react';
import {
  Hammer,
  ShieldCheck,
  Rocket,
  Search,
  Filter,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Commit, PipelineStatus, Tag } from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { TablePagination } from '../../components/ui/Table.tsx';
import {
  PipelineStatusBadge,
  TagBadge,
} from '../../components/common/StatusBadge.tsx';
import { CommitLink, PipelineLink } from '../../components/common/CommitLink.tsx';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters.ts';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';

export interface CommitTableProps {
  commits: Commit[];
  onTriggerBuild: (commit: Commit) => void;
  onPromoteStable: (commit: Commit) => void;
  onCreateRelease: (commit: Commit) => void;
  searchFilter: string;
  onSearchChange: (val: string) => void;
  statusFilter: PipelineStatus | 'All';
  onStatusFilterChange: (val: PipelineStatus | 'All') => void;
  tagFilter: Tag | 'All';
  onTagFilterChange: (val: Tag | 'All') => void;
  dateRangeFilter: string;
  onDateRangeChange: (val: string) => void;
}

export function CommitTable({
  commits,
  onTriggerBuild,
  onPromoteStable,
  onCreateRelease,
  searchFilter,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  dateRangeFilter,
  onDateRangeChange,
}: CommitTableProps) {
  const { role, canPromoteStable, canCreateRelease, getRolePermissionReason } = useDashboard();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Pagination slice
  const totalPages = Math.ceil(commits.length / pageSize);
  const paginatedCommits = commits.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Check action enablement and tooltip reasons
  const getBuildActionState = (commit: Commit) => {
    // Enabled only if commit has NO build yet
    if (commit.buildId) {
      return {
        enabled: false,
        reason: `Build already triggered (${commit.pipelineStatus || 'In Progress'})`,
      };
    }
    return { enabled: true, reason: 'Trigger a fresh CI build from this commit' };
  };

  const getPromoteActionState = (commit: Commit) => {
    // Enabled only if pipeline succeeded and not already Stable
    if (!commit.buildId) {
      return { enabled: false, reason: 'No build exists yet for this commit' };
    }
    if (commit.pipelineStatus !== 'Success') {
      return {
        enabled: false,
        reason: `Pipeline status must be Success (current: ${commit.pipelineStatus || 'Unknown'})`,
      };
    }
    if (commit.tags && commit.tags.includes('Stable')) {
      return { enabled: false, reason: 'Already promoted to Stable' };
    }
    const roleReason = getRolePermissionReason('promote');
    if (roleReason) {
      return { enabled: false, reason: roleReason };
    }
    return { enabled: true, reason: 'Promote this validated build to Stable baseline' };
  };

  const getReleaseActionState = (commit: Commit) => {
    // Enabled only if the build is Stable
    const isStable = commit.tags && commit.tags.includes('Stable');
    if (!isStable) {
      return { enabled: false, reason: 'Only Stable builds can be used to create a release' };
    }
    const roleReason = getRolePermissionReason('release');
    if (roleReason) {
      return { enabled: false, reason: roleReason };
    }
    return { enabled: true, reason: 'Create official release build from this Stable build' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)] overflow-hidden flex flex-col">
      {/* Table Filter Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Filter commits by SHA, message, author..."
            value={searchFilter}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Right: Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => {
                onStatusFilterChange(e.target.value as any);
                setCurrentPage(1);
              }}
              title="Filter by Pipeline Status"
            >
              <option value="All">Status: All</option>
              <option value="Success">Success</option>
              <option value="Running">Running</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Canceled">Canceled</option>
            </Select>
          </div>

          {/* Tag Filter */}
          <div className="w-32">
            <Select
              value={tagFilter}
              onChange={(e) => {
                onTagFilterChange(e.target.value as any);
                setCurrentPage(1);
              }}
              title="Filter by Tag"
            >
              <option value="All">Tags: All</option>
              <option value="Stable">Stable</option>
              <option value="Released">Released</option>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="w-36">
            <Select
              value={dateRangeFilter}
              onChange={(e) => {
                onDateRangeChange(e.target.value);
                setCurrentPage(1);
              }}
              title="Filter by Date Range"
            >
              <option value="all">Date: All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table Viewport with Sticky Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F4F1FA]/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-3 px-4 whitespace-nowrap">Commit Time</th>
              <th className="py-3 px-4 whitespace-nowrap">Commit ID</th>
              <th className="py-3 px-4 min-w-[240px]">Change</th>
              <th className="py-3 px-4 whitespace-nowrap">Author</th>
              <th className="py-3 px-4 whitespace-nowrap">Build / Version</th>
              <th className="py-3 px-4 whitespace-nowrap">Pipeline</th>
              <th className="py-3 px-4 whitespace-nowrap">Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Tags</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedCommits.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No matching commits found for current filters.
                </td>
              </tr>
            ) : (
              paginatedCommits.map((commit) => {
                const buildState = getBuildActionState(commit);
                const promoteState = getPromoteActionState(commit);
                const releaseState = getReleaseActionState(commit);

                return (
                  <tr
                    key={commit.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* 1. Commit Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <span
                        className="tabular-nums"
                        title={formatDateTime(commit.timestamp)}
                      >
                        {formatRelativeTime(commit.timestamp)}
                      </span>
                    </td>

                    {/* 2. Commit ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CommitLink sha={commit.sha} gitlabUrl={commit.gitlabUrl} />
                    </td>

                    {/* 3. Change (commit message) */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 line-clamp-2 leading-relaxed">
                        {commit.message}
                      </div>
                    </td>

                    {/* 4. Author */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{commit.authorName}</span>
                      </div>
                    </td>

                    {/* 5. Build/Version */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {commit.version ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[11px] text-[#8E54E9] font-semibold bg-[#F4F1FA] px-2 py-0.5 rounded-md inline-block max-w-fit">
                            {commit.version}
                          </span>
                          {(commit.signingStatus || commit.repackagingStatus) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-sans">
                              {commit.signingStatus && (
                                <span title={`Code Signing: ${commit.signingStatus}`}>
                                  Signing:{' '}
                                  <strong
                                    className={
                                      commit.signingStatus === 'Success'
                                        ? 'text-emerald-600'
                                        : commit.signingStatus === 'Failed'
                                        ? 'text-rose-600'
                                        : 'text-slate-500'
                                    }
                                  >
                                    {commit.signingStatus}
                                  </strong>
                                </span>
                              )}
                              {commit.signingStatus && commit.repackagingStatus && <span>·</span>}
                              {commit.repackagingStatus && (
                                <span title={`Repackaging: ${commit.repackagingStatus}`}>
                                  Packaging:{' '}
                                  <strong
                                    className={
                                      commit.repackagingStatus === 'Success'
                                        ? 'text-emerald-600'
                                        : commit.repackagingStatus === 'Failed'
                                        ? 'text-rose-600'
                                        : 'text-slate-500'
                                    }
                                  >
                                    {commit.repackagingStatus}
                                  </strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* 6. Pipeline */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {commit.pipelineId ? (
                        <PipelineLink pipelineId={commit.pipelineId} />
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* 7. Pipeline Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PipelineStatusBadge status={commit.pipelineStatus} />
                    </td>

                    {/* 8. Tags */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {commit.tags && commit.tags.length > 0 ? (
                          commit.tags.map((tag) => <TagBadge key={tag} tag={tag} />)
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </div>
                    </td>

                    {/* 9. Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Build Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!buildState.enabled}
                          tooltip={buildState.reason}
                          onClick={() => onTriggerBuild(commit)}
                          leftIcon={<Hammer className="w-3 h-3 text-slate-600" />}
                          className="text-[11px] h-7 px-2.5"
                        >
                          Build
                        </Button>

                        {/* Promote Stable Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!promoteState.enabled}
                          tooltip={promoteState.reason}
                          onClick={() => onPromoteStable(commit)}
                          leftIcon={<ShieldCheck className="w-3 h-3 text-[#8E54E9]" />}
                          className="text-[11px] h-7 px-2.5 text-[#8E54E9] hover:bg-[#F4F1FA] hover:border-[#8E54E9]/30"
                        >
                          Promote
                        </Button>

                        {/* Release Button */}
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!releaseState.enabled}
                          tooltip={releaseState.reason}
                          onClick={() => onCreateRelease(commit)}
                          leftIcon={<Rocket className="w-3 h-3" />}
                          className="text-[11px] h-7 px-2.5"
                        >
                          Release
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={commits.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
