import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Rocket, Plus, Layers, GitBranch, AlertCircle, Sparkles } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { ReleaseStepper } from './ReleaseStepper.tsx';
import { ReleasesTable } from './ReleasesTable.tsx';
import { CreateReleaseModal } from './CreateReleaseModal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { ErrorBanner } from '../../components/common/ErrorBanner.tsx';
import { getReleases, retryReleaseStep } from '../../services/releases.ts';
import { getStableHistory } from '../../services/stable.ts';
import { ReleaseRecord, StableRecord } from '../../types/index.ts';

export function ReleasesPage() {
  const location = useLocation();
  const { currentProduct, selectedProductId, refreshTick, triggerRefresh, role, canCreateRelease, getRolePermissionReason } = useDashboard();

  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [stableRecords, setStableRecords] = useState<StableRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [initialSourceBuildId, setInitialSourceBuildId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if navigated from Builds page with sourceBuildId in state
    if (location.state && (location.state as any).sourceBuildId) {
      setInitialSourceBuildId((location.state as any).sourceBuildId);
      setIsCreateModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    let isMounted = true;
    async function loadReleaseData() {
      if (!selectedProductId) return;
      try {
        setIsLoading(true);
        setError(null);

        const [relList, stableList] = await Promise.all([
          getReleases(selectedProductId),
          getStableHistory(selectedProductId),
        ]);

        if (!isMounted) return;
        setReleases(relList);
        setStableRecords(stableList);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to fetch release pipelines');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReleaseData();
    return () => {
      isMounted = false;
    };
  }, [selectedProductId, refreshTick]);

  const handleRetry = async (releaseId: string, step: 'signing' | 'repackaging') => {
    try {
      await retryReleaseStep(releaseId, step);
      triggerRefresh();
    } catch (err: any) {
      setError(err?.message || `Failed to retry ${step} stage`);
    }
  };

  const handleReleaseCreated = () => {
    triggerRefresh();
  };

  const roleReason = getRolePermissionReason('release');

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Release Pipeline Execution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track HSM code signing, package manifest wrapping, and release delivery readiness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            disabled={!canCreateRelease || stableRecords.length === 0}
            tooltip={
              roleReason ||
              (stableRecords.length === 0
                ? 'No certified Stable builds exist yet to create a release'
                : undefined)
            }
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Release Build
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* PRD Scope & Service Integration Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#8E54E9] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">Release Service Integration Model:</span>{' '}
          In production, code signing and container repackaging are executed asynchronously via
          external signing authorities and backend release-service jobs. Active pipelines displayed
          below illustrate stage progression in mock mode.
        </div>
      </div>

      {/* Active Release Pipeline Steppers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#8E54E9]" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Release Pipeline Stages
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {releases.length} Configured Releases
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : releases.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
            No release pipelines triggered yet for {currentProduct?.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {releases.map((rel) => {
              const currentStageName =
                rel.repackagingStatus === 'Running' || rel.repackagingStatus === 'Failed'
                  ? 'Repackaging'
                  : rel.signingStatus === 'Running' || rel.signingStatus === 'Failed'
                  ? 'Code Signing'
                  : rel.releaseStatus === 'Running' || rel.releaseStatus === 'Failed'
                  ? 'Release Build'
                  : rel.repackagingStatus === 'Success'
                  ? 'Release Ready'
                  : 'Pending';

              return (
                <Card key={rel.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold font-mono text-slate-900 bg-[#F4F1FA] text-[#8E54E9] px-3 py-1 rounded-xl">
                        {rel.version}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        Source: <strong className="text-slate-800">{currentProduct?.code}</strong> · branch:{' '}
                        <strong className="text-slate-800 font-mono">{rel.branch}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        Current Stage: <strong className="text-[#8E54E9]">{currentStageName}</strong>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Initiated by <strong className="text-slate-600">{rel.startedBy}</strong></span>
                    </div>
                  </div>

                  {/* Horizontal Stepper */}
                  <ReleaseStepper release={rel} />

                {/* Error Banner inside card if failed */}
                {rel.errorMessage && (
                  <div className="mt-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-mono">{rel.errorMessage}</span>
                    </div>
                    {rel.retryAllowed && (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!canCreateRelease}
                        tooltip={roleReason || undefined}
                        onClick={() =>
                          handleRetry(
                            rel.id,
                            rel.repackagingStatus === 'Failed' ? 'repackaging' : 'signing'
                          )
                        }
                      >
                        Retry Step
                      </Button>
                    )}
                  </div>
                )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Releases Table */}
      <div>
        <ReleasesTable releases={releases} onRetry={handleRetry} />
      </div>

      {/* Create Release Modal */}
      <CreateReleaseModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialSourceBuildId(undefined);
        }}
        stableRecords={stableRecords}
        initialStableBuildId={initialSourceBuildId}
        onReleaseCreated={handleReleaseCreated}
      />
    </div>
  );
}
