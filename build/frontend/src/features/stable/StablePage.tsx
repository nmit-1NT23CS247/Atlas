import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, GitBranch, AlertCircle, Info } from 'lucide-react';
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
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [candidateCommit, setCandidateCommit] = useState<Commit | null>(null);
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
        if (allCandidates.length > 0) {
          setCandidateCommit(allCandidates[0]);
        }
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
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)] flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-[#8E54E9] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800 font-semibold block mb-0.5">
            GitLab CI/CD Automated Baseline Gate
          </strong>
          Promoting a build to Stable requires mandatory verification: all 14 integration test
          matrix jobs must succeed, security SAST/DAST checks must be clean, and container
          checksums must be cataloged in the GitLab package registry.
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
                    className="p-5 rounded-2xl bg-[#F4F1FA]/60 border border-slate-200/50 space-y-3"
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

      {/* Candidate Selector Modal before Promotion Checklist */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsPromoteModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Select Build Candidate to Promote
            </h3>
            <p className="text-xs text-slate-500">
              Only builds with successful pipelines that are not currently stable can be promoted.
            </p>

            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-700 block">
                Candidate Build
              </label>
              <Select
                value={candidateCommit?.sha || ''}
                onChange={(e) => {
                  const found = availableCandidates.find((c) => c.sha === e.target.value);
                  if (found) setCandidateCommit(found);
                }}
              >
                {availableCandidates.map((c) => (
                  <option key={c.sha} value={c.sha}>
                    [{c.branch}] {c.version || c.shortSha} — {c.authorName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPromoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsPromoteModalOpen(false);
                  setIsVerificationModalOpen(true);
                }}
              >
                Proceed to Verification
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Stable Checklist Dialog */}
      <PromoteStableModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        commit={candidateCommit}
        onPromoted={handlePromoteSuccess}
      />
    </div>
  );
}
