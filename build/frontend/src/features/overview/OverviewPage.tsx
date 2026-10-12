import React, { useState, useEffect } from 'react';
import { Hammer, PlayCircle, Rocket, ShieldCheck, AlertCircle, History, Package } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { SummaryCard } from './SummaryCard.tsx';
import { StableBranchCard } from './StableBranchCard.tsx';
import { RecentActivityList } from './RecentActivityList.tsx';
import { AttentionList, AttentionItem } from './AttentionList.tsx';
import { RunningList, RunningItem } from './RunningList.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { ErrorBanner } from '../../components/common/ErrorBanner.tsx';
import { getBranches } from '../../services/products.ts';
import { getCommits } from '../../services/commits.ts';
import { getStableHistory } from '../../services/stable.ts';
import { getReleases } from '../../services/releases.ts';
import { getActivity } from '../../services/activity.ts';
import { Branch, StableRecord, ReleaseRecord, AuditEntry } from '../../types/index.ts';

export function OverviewPage() {
  const { currentProduct, selectedProductId, refreshTick } = useDashboard();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [stableRecords, setStableRecords] = useState<StableRecord[]>([]);
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [activities, setActivities] = useState<AuditEntry[]>([]);

  // Actionable lists
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [runningItems, setRunningItems] = useState<RunningItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derived KPI metrics
  const [buildsTodayCount, setBuildsTodayCount] = useState<number>(0);
  const [pipelinesRunningCount, setPipelinesRunningCount] = useState<number>(0);
  const [releasesInProgressCount, setReleasesInProgressCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadOverviewData() {
      if (!selectedProductId) return;
      try {
        setIsLoading(true);
        setError(null);

        const [branchList, stableList, releaseList, actList] = await Promise.all([
          getBranches(selectedProductId),
          getStableHistory(selectedProductId),
          getReleases(selectedProductId),
          getActivity({ product: currentProduct?.code || selectedProductId.toUpperCase() }),
        ]);

        if (!isMounted) return;

        setBranches(branchList);
        setStableRecords(stableList);
        setReleases(releaseList);
        setActivities(actList);

        // Fetch commits for each branch to compile operational state
        let allProductCommits: any[] = [];
        for (const branch of branchList) {
          const commits = await getCommits(selectedProductId, branch.name);
          allProductCommits = allProductCommits.concat(commits);
        }

        // 1. KPI Counts
        const now = Date.now();
        const oneDayMs = 24 * 3600 * 1000;
        const todayCommits = allProductCommits.filter((c) => {
          const t = new Date(c.timestamp).getTime();
          return now - t <= oneDayMs && c.buildId;
        });
        setBuildsTodayCount(todayCommits.length);

        const runningPipelines = allProductCommits.filter((c) => c.pipelineStatus === 'Running');
        setPipelinesRunningCount(runningPipelines.length);

        const activeReleases = releaseList.filter(
          (r) =>
            r.releaseStatus === 'Running' ||
            r.signingStatus === 'Running' ||
            r.repackagingStatus === 'Running'
        );
        setReleasesInProgressCount(activeReleases.length);

        // 2. Actionable Attention List ("What has failed or needs attention?")
        const failures: AttentionItem[] = [];

        // Check failed releases
        releaseList
          .filter(
            (r) =>
              r.releaseStatus === 'Failed' ||
              r.signingStatus === 'Failed' ||
              r.repackagingStatus === 'Failed'
          )
          .forEach((rel) => {
            failures.push({
              id: `fail-rel-${rel.id}`,
              type: 'release',
              title: `Release Failure: ${rel.version}`,
              subtitle: `Branch: ${rel.branch}`,
              reason:
                rel.errorMessage ||
                `Failed during ${
                  rel.repackagingStatus === 'Failed'
                    ? 'Repackaging'
                    : rel.signingStatus === 'Failed'
                    ? 'Code Signing'
                    : 'Release Build'
                } stage`,
              timestamp: rel.startedAt,
              branch: rel.branch,
              version: rel.version,
              linkTo: '/releases',
              actionLabel: 'Resolve in Releases',
              retryAllowed: rel.retryAllowed,
            });
          });

        // Check recent failed commit builds (last 5)
        allProductCommits
          .filter((c) => c.pipelineStatus === 'Failed')
          .slice(0, 3)
          .forEach((cmt) => {
            failures.push({
              id: `fail-bld-${cmt.id}`,
              type: 'build',
              title: `Pipeline #${cmt.pipelineId?.replace('pl-', '') || 'Failed'} Error`,
              subtitle: `Commit on ${cmt.branch}`,
              reason: `Build job for commit ${cmt.shortSha} failed validation tests`,
              timestamp: cmt.timestamp,
              branch: cmt.branch,
              commitSha: cmt.sha,
              version: cmt.version,
              linkTo: '/builds',
              actionLabel: 'Inspect Build',
            });
          });

        setAttentionItems(failures);

        // 3. In-Flight Running Executions ("What is running?")
        const inFlight: RunningItem[] = [];

        runningPipelines.forEach((c) => {
          inFlight.push({
            id: `run-bld-${c.id}`,
            type: 'pipeline',
            title: `Runner Pipeline #${c.pipelineId?.replace('pl-', '') || c.shortSha}`,
            stageName: 'Unit & SAST Verification',
            branch: c.branch,
            version: c.version,
            commitSha: c.sha,
            pipelineId: c.pipelineId,
            startTime: c.timestamp,
            linkTo: '/builds',
          });
        });

        activeReleases.forEach((r) => {
          const currentStage =
            r.releaseStatus === 'Running'
              ? 'Release Build'
              : r.signingStatus === 'Running'
              ? 'Code Signing'
              : 'Repackaging';
          inFlight.push({
            id: `run-rel-${r.id}`,
            type: 'release',
            title: `Release Candidate: ${r.version}`,
            stageName: currentStage,
            branch: r.branch,
            version: r.version,
            startTime: r.startedAt,
            linkTo: '/releases',
          });
        });

        setRunningItems(inFlight);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to fetch overview metrics');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOverviewData();
    return () => {
      isMounted = false;
    };
  }, [selectedProductId, currentProduct, refreshTick]);

  return (
    <div className="space-y-6">
      {/* Page Title Header (no duplicate refresh button) */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {currentProduct ? `${currentProduct.name} (${currentProduct.code})` : 'Product Overview'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Operational pipeline status, certified Stable baselines, and release execution
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* 1. Summary Metric Cards: Builds Today, Pipelines Running, Releases In Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </>
        ) : (
          <>
            <SummaryCard
              title="Builds Today"
              value={buildsTodayCount}
              subtitle="Triggered across active branches"
              icon={Hammer}
              variant="orange-pink"
            />
            <SummaryCard
              title="Pipelines Running"
              value={pipelinesRunningCount}
              subtitle="GitLab runner jobs in flight"
              icon={PlayCircle}
              variant="blue-cyan"
            />
            <SummaryCard
              title="Releases In Progress"
              value={releasesInProgressCount}
              subtitle="Signing and repackaging pipelines"
              icon={Rocket}
              variant="teal-green"
            />
          </>
        )}
      </div>

      {/* 2. Operational Questions: Needs Attention & Running In-Flight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): What has failed or needs attention? */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Action Required · Failed Stages
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {attentionItems.length} items
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : (
            <AttentionList items={attentionItems} />
          )}
        </div>

        {/* Right (5 cols): What is running? */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                In-Flight Executions
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {runningItems.length} running
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : (
            <RunningList items={runningItems} />
          )}
        </div>
      </div>

      {/* 3. Available Stable & Recent Activity Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): Current Stable by configured branch */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8E54E9]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Current Stable Artifacts by Branch
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {branches.length} Configured Branches
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {branches.map((b) => {
                const currentStable = stableRecords.find(
                  (r) => r.branch === b.name && r.isCurrent
                );
                return (
                  <StableBranchCard
                    key={b.id}
                    branchName={b.name}
                    stableRecord={currentStable}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right (5 cols): Compact Recent Activity (last 5 actions) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#8E54E9]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Activity
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Last 5 actions</span>
          </div>

          <Card className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : (
              <RecentActivityList activities={activities} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
