import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { pipelineService } from '../../services/pipelineService';
import { PipelineListResponse } from '../../types/pipeline';
import { DashboardOutletContext } from '../../layouts/DashboardLayout';
import { MetricCard } from '../../components/data-display/MetricCard';
import { RecentPipelinesTable } from './components/RecentPipelinesTable';
import { FailedPipelinesPanel } from './components/FailedPipelinesPanel';
import { Button } from '../../components/ui/Button';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<DashboardOutletContext | undefined>();
  const refreshKey = outletContext?.refreshKey ?? 0;

  const [data, setData] = useState<PipelineListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pipelineService.getOverviewData();
      setData(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load pipeline overview';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Pipeline Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Operational status across configured projects and branches.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/pipelines')}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          iconPosition="right"
        >
          View All Pipelines
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={loadData}
            icon={<RotateCw className="w-3 h-3" />}
            className="hover:border-rose-300 hover:text-rose-700 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-200/60 border border-slate-200" />
            ))}
          </div>
          <div className="h-32 rounded-xl bg-slate-200/60 border border-slate-200" />
          <div className="h-64 rounded-xl bg-slate-200/60 border border-slate-200" />
        </div>
      )}

      {/* Populated Content */}
      {data && (
        <>
          {/* A. Four Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              label="Total Pipelines"
              value={data.summary.totalPipelines}
              icon={GitPullRequest}
              statusVariant="info"
            />

            <MetricCard
              label="Successful Pipelines"
              value={data.summary.successful}
              icon={CheckCircle2}
              statusVariant="success"
            />

            <MetricCard
              label="Failed Pipelines"
              value={data.summary.failed}
              icon={XCircle}
              statusVariant="danger"
            />

            <MetricCard
              label="Running Pipelines"
              value={data.summary.running}
              icon={Activity}
              statusVariant="default"
            />
          </div>

          {/* C. Recent Failures Attention List */}
          <FailedPipelinesPanel failures={data.recentFailures} />

          {/* B. Recent Pipelines Table (Primary Component) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Pipelines
                </h2>
                <p className="text-xs text-slate-500">
                  Latest CI/CD executions ordered by start time
                </p>
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => navigate('/pipelines')}
                icon={<ArrowRight className="w-3 h-3 text-blue-600" />}
                iconPosition="right"
                className="text-blue-600 hover:text-blue-700"
              >
                All {data.summary.totalPipelines} pipelines
              </Button>
            </div>

            <RecentPipelinesTable pipelines={data.recentPipelines} />
          </div>
        </>
      )}
    </div>
  );
};
