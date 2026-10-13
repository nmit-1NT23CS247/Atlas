import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hammer, PlayCircle, Rocket, ShieldCheck, AlertCircle, History } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { SummaryCard } from './SummaryCard.tsx';
import { StableBranchCard } from './StableBranchCard.tsx';
import { RecentActivityList } from './RecentActivityList.tsx';
import { AttentionList, AttentionItem } from './AttentionList.tsx';
import { RunningList, RunningItem } from './RunningList.tsx';
import { Card } from '../../components/ui/Card.tsx';
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
      {/* Page Title & System State Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentProduct ? `${currentProduct.name} (${currentProduct.code})` : 'Product Overview'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System status, certified Stable baselines, and release progression
          </p>
        </div>

        {/* High-level primary action based on system health */}
        <div className="flex items-center gap-3">
          {attentionItems.length > 0 ? (
            <Link
              to={attentionItems[0].linkTo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Review {attentionItems.length} Blocking Issue{attentionItems.length > 1 ? 's' : ''}</span>
            </Link>
          ) : (
            <Link
              to="/builds"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors shadow-xs"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Inspect Builds & Commits</span>
            </Link>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* High-Level Enterprise Workflow Banner: Explainable to Management in 30 Seconds */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {attentionItems.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Action Required · {attentionItems.length} Stage Failure
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                System Nominal · All Pipelines Passing
              </span>
            )}
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">3-Stage Engineering Lifecycle</span>
          </div>
          <p className="text-xs text-slate-500">
            {attentionItems.length > 0
              ? 'One release or build pipeline failed validation. Follow the workflow steps below to inspect, verify, and deliver.'
              : 'Continuous delivery active across all branches. Stable baselines are certified and release candidates are ready.'}
          </p>
        </div>

        {/* 3 Workflow steps */}
        <div className="flex items-center gap-2 text-xs shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex-wrap sm:flex-nowrap">
          <Link
            to="/builds"
            className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#7C3AED] px-2 py-1 rounded-lg hover:bg-white transition-colors"
          >
            <Hammer className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Builds</span>
          </Link>
          <span className="text-slate-300 font-bold">&rarr;</span>
          <Link
            to="/stable"
            className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#7C3AED] px-2 py-1 rounded-lg hover:bg-white transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>2. Stable Gates</span>
          </Link>
          <span className="text-slate-300 font-bold">&rarr;</span>
          <Link
            to="/releases"
            className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#7C3AED] px-2 py-1 rounded-lg hover:bg-white transition-colors"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Releases</span>
          </Link>
        </div>
      </div>

      {/* 1. Summary Metric Cards: Builds Today, Pipelines Running, Releases In Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : (
          <>
            <SummaryCard
              title="Builds Today"
              value={buildsTodayCount}
              subtitle="Triggered across active branches"
              icon={Hammer}
              variant="warning"
            />
            <SummaryCard
              title="Pipelines Running"
              value={pipelinesRunningCount}
              subtitle="GitLab runner jobs in flight"
              icon={PlayCircle}
              variant="info"
            />
            <SummaryCard
              title="Releases In Progress"
              value={releasesInProgressCount}
              subtitle="Signing and repackaging pipelines"
              icon={Rocket}
              variant="success"
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
              <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Current Stable Baselines by Branch
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {branches.length} Configured Branches
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : branches.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-200/80 text-xs text-slate-500">
              No branches configured for this product.
            </div>
          ) : (
            <div className="space-y-2">
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
              <History className="w-4 h-4 text-[#7C3AED]" />
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
