import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pipelineService } from '../../services/pipelineService';
import { StatusBadge } from '../../components/data-display/StatusBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PipelineMetadata } from './components/PipelineMetadata';
import { StageTimeline } from './components/StageTimeline';
import {
  ArrowLeft,
  ExternalLink,
  AlertOctagon,
} from 'lucide-react';

export const PipelineDetailsPage: React.FC = () => {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();

  const numericId = pipelineId ? parseInt(pipelineId, 10) : NaN;
  const pipeline = useMemo(() => {
    if (isNaN(numericId)) return undefined;
    return pipelineService.getPipelineById(numericId);
  }, [numericId]);

  const stages = useMemo(() => {
    if (!pipeline) return [];
    return pipelineService.getStageGroups(pipeline.id);
  }, [pipeline]);

  if (!pipeline) {
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

        {/* External GitLab Link (Disabled placeholder for prototype) */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled
            title="External GitLab connection not configured in prototype"
            icon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
            iconPosition="right"
            className="cursor-not-allowed opacity-60 text-xs"
          >
            Open in GitLab
          </Button>
        </div>
      </div>

      {/* Pipeline Information */}
      <PipelineMetadata pipeline={pipeline} />

      {/* Stages & Jobs Hierarchy */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-bold text-slate-900">
          Stages and Jobs ({stages.length} stages)
        </h2>

        <StageTimeline stages={stages} />
      </div>
    </div>
  );
};
