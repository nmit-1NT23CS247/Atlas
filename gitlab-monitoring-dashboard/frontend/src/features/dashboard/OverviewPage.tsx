import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pipelineService } from '../../services/pipelineService';
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
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Derive metrics strictly from the shared pipeline dataset
  const metrics = pipelineService.getSummaryMetrics();
  const failures = pipelineService.getRecentFailedPipelines();
  const recentPipelines = pipelineService.getPipelines().slice(0, 10);

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

      {/* A. Four Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          label="Total Pipelines"
          value={metrics.totalPipelines}
          icon={GitPullRequest}
          statusVariant="info"
        />

        <MetricCard
          label="Successful Pipelines"
          value={metrics.successful}
          icon={CheckCircle2}
          statusVariant="success"
        />

        <MetricCard
          label="Failed Pipelines"
          value={metrics.failed}
          icon={XCircle}
          statusVariant="danger"
        />

        <MetricCard
          label="Running Pipelines"
          value={metrics.running}
          icon={Activity}
          statusVariant="default"
        />
      </div>

      {/* C. Recent Failures Attention List */}
      <FailedPipelinesPanel failures={failures} />

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
            All {metrics.totalPipelines} pipelines
          </Button>
        </div>

        <RecentPipelinesTable pipelines={recentPipelines} />
      </div>
    </div>
  );
};
