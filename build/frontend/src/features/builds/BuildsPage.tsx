import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { BranchSelectorPanel } from './BranchSelectorPanel.tsx';
import { CommitTable } from './CommitTable.tsx';
import { TriggerBuildModal } from './TriggerBuildModal.tsx';
import { PromoteStableModal } from './PromoteStableModal.tsx';
import { TableSkeletonRows } from '../../components/ui/Skeleton.tsx';
import { ErrorBanner } from '../../components/common/ErrorBanner.tsx';
import { getBranches } from '../../services/products.ts';
import { getCommits } from '../../services/commits.ts';
import { triggerBuild } from '../../services/builds.ts';
import { Branch, Commit, PipelineStatus, Tag } from '../../types/index.ts';

export function BuildsPage() {
  const navigate = useNavigate();
  const { currentProduct, selectedProductId, refreshTick, triggerRefresh, role } = useDashboard();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [isLoadingCommits, setIsLoadingCommits] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<Tag | 'All'>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  // Modals state
  const [buildModalCommit, setBuildModalCommit] = useState<Commit | null>(null);
  const [promoteModalCommit, setPromoteModalCommit] = useState<Commit | null>(null);

  // 1. Load branches for active product
  useEffect(() => {
    let isMounted = true;
    async function loadBranches() {
      if (!selectedProductId) return;
      try {
        setIsLoadingBranches(true);
        setError(null);
        const data = await getBranches(selectedProductId);
        if (!isMounted) return;
        setBranches(data);

        // Keep current selected branch if available, else pick default or first
        if (data.length > 0) {
          const defaultBranch = data.find((b) => b.isDefault)?.name || data[0].name;
          if (!data.some((b) => b.name === selectedBranch)) {
            setSelectedBranch(defaultBranch);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load branch list');
      } finally {
        if (isMounted) setIsLoadingBranches(false);
      }
    }

    loadBranches();
    return () => {
      isMounted = false;
    };
  }, [selectedProductId]);

  // 2. Load commits for selected product & branch
  const fetchCommits = useCallback(async () => {
    if (!selectedProductId || !selectedBranch) return;
    try {
      setIsLoadingCommits(true);
      const data = await getCommits(selectedProductId, selectedBranch, searchFilter, {
        status: statusFilter,
        tag: tagFilter,
        dateRange: dateRangeFilter,
      });
      setCommits(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve commit history from GitLab');
    } finally {
      setIsLoadingCommits(false);
    }
  }, [selectedProductId, selectedBranch, searchFilter, statusFilter, tagFilter, dateRangeFilter]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits, refreshTick]);

  // Handle Trigger Build action
  const handleConfirmBuild = async (commitToBuild: Commit) => {
    await triggerBuild(
      commitToBuild.sha,
      selectedProductId,
      selectedBranch,
      `${role} User`
    );
    triggerRefresh();
    fetchCommits();
  };

  // Handle Promote Stable success
  const handlePromoteSuccess = () => {
    triggerRefresh();
    fetchCommits();
  };

  // Handle Release Click -> navigate to Releases page or open release flow
  const handleCreateRelease = (commit: Commit) => {
    navigate('/releases', { state: { sourceBuildId: commit.buildId } });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Build Management & Commit Pipelines
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pick a branch, inspect commits, trigger builds, and validate CI test gates
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchCommits} />}

      {/* 2-Column Split: Left Branch Panel (col-span-3) + Right Commit Table (col-span-9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Branches */}
        <div className="lg:col-span-3">
          <BranchSelectorPanel
            branches={branches}
            selectedBranch={selectedBranch}
            onSelectBranch={(b) => setSelectedBranch(b)}
            isLoading={isLoadingBranches}
          />
        </div>

        {/* Right Column: Commit Table */}
        <div className="lg:col-span-9">
          {isLoadingCommits && commits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <TableSkeletonRows rows={7} cols={8} />
            </div>
          ) : (
            <CommitTable
              commits={commits}
              onTriggerBuild={(c) => setBuildModalCommit(c)}
              onPromoteStable={(c) => setPromoteModalCommit(c)}
              onCreateRelease={handleCreateRelease}
              searchFilter={searchFilter}
              onSearchChange={setSearchFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              tagFilter={tagFilter}
              onTagFilterChange={setTagFilter}
              dateRangeFilter={dateRangeFilter}
              onDateRangeChange={setDateRangeFilter}
            />
          )}
        </div>
      </div>

      {/* Trigger Build Modal */}
      <TriggerBuildModal
        isOpen={Boolean(buildModalCommit)}
        onClose={() => setBuildModalCommit(null)}
        commit={buildModalCommit}
        productName={currentProduct?.name || ''}
        productCode={currentProduct?.code || ''}
        onConfirmBuild={handleConfirmBuild}
      />

      {/* Promote Stable Modal */}
      <PromoteStableModal
        isOpen={Boolean(promoteModalCommit)}
        onClose={() => setPromoteModalCommit(null)}
        commit={promoteModalCommit}
        onPromoted={handlePromoteSuccess}
      />
    </div>
  );
}
