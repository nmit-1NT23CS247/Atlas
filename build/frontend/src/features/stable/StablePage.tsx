import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, GitBranch } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { StableCard } from './StableCard.tsx';
import { StableHistoryTable } from './StableHistoryTable.tsx';
import { PromoteStableModal } from '../builds/PromoteStableModal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { ErrorBanner } from '../../components/common/ErrorBanner.tsx';
import { getBranches } from '../../services/products.ts';
import { getStableHistory } from '../../services/stable.ts';
import { getCommits } from '../../services/commits.ts';
import { Branch, StableRecord, Commit } from '../../types/index.ts';

export function StablePage() {
  const { currentProduct, selectedProductId, refreshTick, triggerRefresh, role, canPromoteStable, getRolePermissionReason } = useDashboard();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [stableRecords, setStableRecords] = useState<StableRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick promote modal state
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState<boolean>(false);
  const [availableCandidates, setAvailableCandidates] = useState<Commit[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadStableData() {
      if (!selectedProductId) return;
      try {
        setIsLoading(true);
        setError(null);

        const [branchList, history] = await Promise.all([
          getBranches(selectedProductId),
          getStableHistory(selectedProductId, selectedBranchFilter),
        ]);

        if (!isMounted) return;
        setBranches(branchList);
        setStableRecords(history);

        // Also fetch candidate commits (successful builds not yet promoted)
        const allCandidates: Commit[] = [];
        for (const b of branchList) {
          const commits = await getCommits(selectedProductId, b.name);
          const eligible = commits.filter(
            (c) =>
              c.pipelineStatus === 'Success' &&
              c.buildId &&
              (!c.tags || !c.tags.includes('Stable'))
          );
          allCandidates.push(...eligible);
        }
        setAvailableCandidates(allCandidates);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to fetch stable builds data');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStableData();
    return () => {
      isMounted = false;
    };
  }, [selectedProductId, selectedBranchFilter, refreshTick]);

  const handlePromoteSuccess = () => {
    triggerRefresh();
  };

  const roleReason = getRolePermissionReason('promote');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Stable Baseline Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Current and previous certified stable releases across production branches
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            disabled={!canPromoteStable || availableCandidates.length === 0}
            tooltip={
              roleReason ||
              (availableCandidates.length === 0
                ? 'No builds currently qualify for Stable promotion (requires Success pipeline)'
                : undefined)
            }
            onClick={() => setIsPromoteModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Promote to Stable
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Info notice about promotion criteria */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-semibold block mb-0.5">
            Automated Quality Gate Certification
          </strong>
          Promoting a build to Stable requires verified passage of 14 matrix integration tests,
          clean SAST/DAST security scans, and cataloged package checksums.
        </div>
      </div>

      {/* Branch Current vs Previous Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#8E54E9]" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Stable Baselines by Branch
            </h2>
          </div>

          <div className="w-48">
            <Select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
            >
              <option value="all">Filter: All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {branches
              .filter(
                (b) =>
                  selectedBranchFilter === 'all' || b.name === selectedBranchFilter
              )
              .map((branch) => {
                const currentRecord = stableRecords.find(
                  (r) => r.branch === branch.name && r.isCurrent
                );
                const previousRecord = stableRecords.find(
                  (r) => r.branch === branch.name && r.isPrevious
                );

                return (
                  <div
                    key={branch.id}
                    className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">
                          Branch: {branch.name}
                        </span>
                        {branch.isDefault && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md font-medium">
                            default
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StableCard
                        title="Current Stable"
                        type="current"
                        branchName={branch.name}
                        record={currentRecord}
                      />
                      <StableCard
                        title="Previous Stable"
                        type="previous"
                        branchName={branch.name}
                        record={previousRecord}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Stable History Table */}
      <div>
        <StableHistoryTable records={stableRecords} />
      </div>

      {/* Promote Stable Checklist Dialog */}
      <PromoteStableModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        candidateCommits={availableCandidates}
        onPromoted={handlePromoteSuccess}
      />
    </div>
  );
}
