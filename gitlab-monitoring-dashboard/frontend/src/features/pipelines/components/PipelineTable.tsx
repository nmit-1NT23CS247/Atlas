import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pipeline } from '../../../types/pipeline';
import { StatusBadge } from '../../../components/data-display/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';
import { formatDuration, formatCommitSha } from '../../../lib/formatters';
import { formatRelativeTime, formatDateTime } from '../../../lib/date';
import { ArrowRight, GitCommit, ArrowUpDown } from 'lucide-react';

export interface PipelineTableProps {
  pipelines: Pipeline[];
  onSortChange?: (by: 'startedAt' | 'durationSeconds' | 'id') => void;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export const PipelineTable: React.FC<PipelineTableProps> = ({
  pipelines,
  onSortChange,
  currentSortBy,
  currentSortOrder,
}) => {
  const navigate = useNavigate();

  const renderSortIndicator = (columnKey: string) => {
    if (currentSortBy !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    }
    return (
      <span className="text-blue-600 font-mono text-[10px] ml-1">
        {currentSortOrder === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-2.5 px-3.5 whitespace-nowrap">Status</th>
            <th
              className="py-2.5 px-3.5 whitespace-nowrap cursor-pointer hover:text-slate-800"
              onClick={() => onSortChange?.('id')}
            >
              <span>Pipeline ID</span>
              {renderSortIndicator('id')}
            </th>
            <th className="py-2.5 px-3.5 whitespace-nowrap">Project</th>
            <th className="py-2.5 px-3.5 whitespace-nowrap">Branch</th>
            <th className="py-2.5 px-3.5 whitespace-nowrap">Commit</th>
            <th
              className="py-2.5 px-3.5 whitespace-nowrap cursor-pointer hover:text-slate-800"
              onClick={() => onSortChange?.('startedAt')}
            >
              <span>Started at</span>
              {renderSortIndicator('startedAt')}
            </th>
            <th
              className="py-2.5 px-3.5 whitespace-nowrap text-right cursor-pointer hover:text-slate-800"
              onClick={() => onSortChange?.('durationSeconds')}
            >
              <span>Duration</span>
              {renderSortIndicator('durationSeconds')}
            </th>
            <th className="py-2.5 px-3.5 whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pipelines.map((pipeline) => (
            <tr
              key={pipeline.id}
              onClick={() => navigate(`/pipelines/${pipeline.id}`)}
              className="cursor-pointer hover:bg-blue-50/50 transition-colors duration-150 group"
            >
              <td className="py-2.5 px-3.5 whitespace-nowrap">
                <StatusBadge status={pipeline.status} size="xs" />
              </td>

              <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-semibold text-blue-600 group-hover:underline">
                #{pipeline.id}
              </td>

              <td className="py-2.5 px-3.5 whitespace-nowrap font-semibold text-slate-800">
                {pipeline.projectName}
              </td>

              <td className="py-2.5 px-3.5 whitespace-nowrap">
                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200/60">
                  {pipeline.ref}
                </span>
              </td>

              <td className="py-2.5 px-3.5 max-w-[220px]">
                <Tooltip content={`Full SHA: ${pipeline.commitSha}`}>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                    <GitCommit className="w-3 h-3 text-slate-400" />
                    {formatCommitSha(pipeline.commitSha)}
                  </span>
                </Tooltip>
                <span className="ml-1.5 text-slate-500 truncate hidden md:inline text-[11px]">
                  {pipeline.commitTitle}
                </span>
              </td>

              <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                <Tooltip content={formatDateTime(pipeline.startedAt)}>
                  <span className="cursor-help">
                    {formatRelativeTime(pipeline.startedAt)}
                  </span>
                </Tooltip>
              </td>

              <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono text-slate-700 tabular-nums font-medium">
                {formatDuration(pipeline.durationSeconds)}
              </td>

              <td
                className="py-2.5 px-3.5 whitespace-nowrap text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigate(`/pipelines/${pipeline.id}`)}
                  className="hover:border-blue-300 hover:text-blue-600"
                  icon={<ArrowRight className="w-3 h-3" />}
                  iconPosition="right"
                >
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
