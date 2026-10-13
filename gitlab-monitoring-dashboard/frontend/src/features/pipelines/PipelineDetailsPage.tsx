import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { pipelineService } from '../../services/pipelineService';
import { PipelineDetail } from '../../types/job';
import { DashboardOutletContext } from '../../layouts/DashboardLayout';
import { StatusBadge } from '../../components/data-display/StatusBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PipelineMetadata } from './components/PipelineMetadata';
import { StageTimeline } from './components/StageTimeline';
import {
  ArrowLeft,
  ExternalLink,
  AlertOctagon,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { ApiError } from '../../services/apiClient';

export const PipelineDetailsPage: React.FC = () => {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const outletContext = useOutletContext<DashboardOutletContext | undefined>();
  const refreshKey = outletContext?.refreshKey ?? 0;

  const [pipeline, setPipeline] = useState<PipelineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericId = pipelineId ? parseInt(pipelineId, 10) : NaN;

  const fetchPipeline = useCallback(async () => {
    if (isNaN(numericId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await pipelineService.getPipelineById(numericId);
      setPipeline(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to load pipeline details';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline, refreshKey]);

  if (notFound) {
    return (
      <EmptyState
        icon={AlertOctagon}
        title={`Pipeline #${pipelineId || ''} Not Found`}
        description="The requested pipeline run could not be found."
        actionLabel="Back to Pipelines"
        onAction={() => navigate('/pipelines')}
      />
    );
  }

  return (
    <div className="space-y-5">
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
            onClick={fetchPipeline}
            icon={<RotateCw className="w-3 h-3" />}
            className="hover:border-rose-300 hover:text-rose-700 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !pipeline && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs animate-pulse">
          Loading pipeline #{pipelineId} details...
        </div>
      )}

      {/* Content */}
      {pipeline && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate('/pipelines')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Pipelines
              </Button>

              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                  Pipeline #{pipeline.id}
                </h1>
                <StatusBadge status={pipeline.status} size="sm" />
              </div>
            </div>

            {/* External GitLab Link */}
            <div className="flex items-center gap-2">
              {pipeline.webUrl ? (
                <a
                  href={pipeline.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ExternalLink className="w-3.5 h-3.5 text-blue-600" />}
                    iconPosition="right"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:border-blue-300"
                  >
                    Open in GitLab
                  </Button>
                </a>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  title="External GitLab URL not available"
                  icon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                  iconPosition="right"
                  className="cursor-not-allowed opacity-60 text-xs"
                >
                  Open in GitLab
                </Button>
              )}
            </div>
          </div>

          {/* Pipeline Information */}
          <PipelineMetadata pipeline={pipeline} />

          {/* Stages & Jobs Hierarchy */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              Stages and Jobs ({pipeline.stages?.length || 0} stages)
            </h2>

            {pipeline.stages && pipeline.stages.length > 0 ? (
              <StageTimeline stages={pipeline.stages} />
            ) : (
              <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs">
                No stages or jobs recorded for this pipeline execution.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
