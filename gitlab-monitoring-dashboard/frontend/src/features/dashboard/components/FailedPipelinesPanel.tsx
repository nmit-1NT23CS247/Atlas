import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Pipeline } from '../../../types/pipeline';
import { Job } from '../../../types/job';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface FailedPipelinesPanelProps {
  failures: {
    pipeline: Pipeline;
    failedJob?: Job;
  }[];
}

export const FailedPipelinesPanel: React.FC<FailedPipelinesPanelProps> = ({
  failures,
}) => {
  const navigate = useNavigate();

  if (failures.length === 0) {
    return (
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>There are no recent failures across monitored projects.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-rose-200/90 bg-rose-50/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Recent Failures ({failures.length})
          </h2>
        </div>
      </div>

      <div className="space-y-2">
        {failures.map(({ pipeline, failedJob }) => (
          <div
            key={pipeline.id}
            className="p-3 rounded-lg border border-rose-200/80 bg-white hover:border-rose-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono font-bold text-blue-600">
                  #{pipeline.id}
                </span>
                <span className="font-semibold text-slate-900">
                  {pipeline.projectName}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                  {pipeline.ref}
                </span>
              </div>

              {failedJob ? (
                <div className="text-[11px] text-rose-700 flex items-center gap-1.5">
                  <span className="font-medium">Failed in stage:</span>
                  <span className="font-mono uppercase font-semibold bg-rose-50 border border-rose-200 px-1 rounded">
                    {failedJob.stage}
                  </span>
                  <span className="text-slate-400">/</span>
                  <span className="font-mono text-slate-700 truncate max-w-[280px]">
                    {failedJob.name}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-rose-700 font-medium">
                  Pipeline execution failed
                </div>
              )}
            </div>

            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate(`/pipelines/${pipeline.id}`)}
              className="text-xs hover:border-rose-300 hover:text-rose-700 self-start sm:self-auto shrink-0"
              icon={<ArrowRight className="w-3 h-3" />}
              iconPosition="right"
            >
              Inspect Details
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
