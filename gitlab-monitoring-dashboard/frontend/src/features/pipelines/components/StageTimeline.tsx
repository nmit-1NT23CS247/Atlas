import React, { useState } from 'react';
import { PipelineStageGroup } from '../../../types/job';
import { StatusBadge } from '../../../components/data-display/StatusBadge';
import { formatDuration } from '../../../lib/formatters';
import { STAGE_DISPLAY_NAMES } from '../../../lib/constants';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

export interface StageTimelineProps {
  stages: PipelineStageGroup[];
}

export const StageTimeline: React.FC<StageTimelineProps> = ({ stages }) => {
  // Expand all stages by default
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    stages.forEach((st) => {
      map[st.name] = true;
    });
    return map;
  });

  const toggleStage = (stageName: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageName]: !prev[stageName],
    }));
  };

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const isExpanded = expandedStages[stage.name];
        const hasFailure = stage.status === 'failed';

        return (
          <div
            key={stage.name}
            className={`rounded-xl border transition-all ${
              hasFailure
                ? 'border-rose-200 bg-rose-50/15'
                : 'border-slate-200 bg-white'
            } shadow-2xs overflow-hidden`}
          >
            {/* Stage Header */}
            <div
              onClick={() => toggleStage(stage.name)}
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/70 select-none transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-2.5">
                <button
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  aria-label={isExpanded ? 'Collapse stage' : 'Expand stage'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <StatusBadge status={stage.status} size="xs" />
                <span className="font-bold text-xs text-slate-800">
                  {STAGE_DISPLAY_NAMES[stage.name] || stage.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({stage.passedJobs}/{stage.totalJobs} jobs passed)
                </span>
              </div>

              <div className="text-xs text-slate-500 font-mono tabular-nums">
                {formatDuration(stage.durationSeconds)}
              </div>
            </div>

            {/* Jobs in this stage */}
            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {stage.jobs.map((job) => {
                  const isFailed = job.status === 'failed';

                  return (
                    <div
                      key={job.id}
                      className={`p-3 text-xs flex flex-col gap-1.5 transition-colors ${
                        isFailed ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusBadge status={job.status} size="xs" />
                          <span
                            className={`font-mono font-medium truncate ${
                              isFailed ? 'text-rose-900 font-semibold' : 'text-slate-800'
                            }`}
                          >
                            {job.name}
                          </span>
                        </div>

                        <div className="font-mono text-slate-500 shrink-0 tabular-nums text-[11px]">
                          {formatDuration(job.durationSeconds)}
                        </div>
                      </div>

                      {/* Job failure message if applicable */}
                      {job.failureMessage && (
                        <div className="mt-1 p-2 rounded bg-rose-100/70 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                          <div className="min-w-0 break-words flex-1">
                            {job.failureMessage}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
