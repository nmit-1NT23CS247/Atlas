import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { PipelineFilters } from '../../../services/pipelineService';
import { Project } from '../../../types/project';
import { Search, X, Filter } from 'lucide-react';

export interface PipelineFiltersProps {
  filters: PipelineFilters;
  onChange: (updated: PipelineFilters) => void;
  onReset: () => void;
  projects: Project[];
  availableBranches: string[];
  totalMatches: number;
}

export const PipelineFiltersBar: React.FC<PipelineFiltersProps> = ({
  filters,
  onChange,
  onReset,
  projects,
  availableBranches,
  totalMatches,
}) => {
  const projectOptions = [
    { value: 'all', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'success', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'running', label: 'Running' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'pending', label: 'Pending' },
  ];

  const branchOptions = [
    { value: 'all', label: 'All Branches' },
    ...availableBranches.map((b) => ({ value: b, label: b })),
  ];

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.projectId && filters.projectId !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.ref && filters.ref !== 'all');

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Search */}
        <div className="w-full">
          <Input
            placeholder="Search ID, project, commit SHA..."
            icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            clearable
            onClear={() => onChange({ ...filters, search: '' })}
            className="h-8 text-xs"
          />
        </div>

        {/* Project Selector */}
        <div className="w-full">
          <Select
            options={projectOptions}
            value={filters.projectId || 'all'}
            onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
            className="h-8 text-xs py-1"
          />
        </div>

        {/* Status Selector */}
        <div className="w-full">
          <Select
            options={statusOptions}
            value={filters.status || 'all'}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as PipelineFilters['status'],
              })
            }
            className="h-8 text-xs py-1"
          />
        </div>

        {/* Branch Filter */}
        <div className="w-full">
          <Select
            options={branchOptions}
            value={filters.ref || 'all'}
            onChange={(e) => onChange({ ...filters, ref: e.target.value })}
            className="h-8 text-xs py-1"
          />
        </div>
      </div>

      {/* Filter Counts & Clear Action */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Matching pipelines: <strong className="font-mono text-slate-800">{totalMatches}</strong>
          </span>
        </div>

        {hasActiveFilters && (
          <Button
            size="xs"
            variant="ghost"
            onClick={onReset}
            className="text-slate-500 hover:text-slate-800 h-6 px-2 text-xs"
            icon={<X className="w-3 h-3" />}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};
