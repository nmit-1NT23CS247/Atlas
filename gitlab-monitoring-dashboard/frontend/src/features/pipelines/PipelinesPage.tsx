import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pipelineService, PipelineFilters } from '../../services/pipelineService';
import { projectService } from '../../services/projectService';
import { PipelineFiltersBar } from './components/PipelineFilters';
import { PipelineTable } from './components/PipelineTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchX } from 'lucide-react';

export const PipelinesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const projects = useMemo(() => projectService.getProjects(), []);

  // Compute unique branches from pipeline records
  const availableBranches = useMemo(() => {
    const all = pipelineService.getPipelines();
    const unique = Array.from(new Set(all.map((p) => p.ref))).sort();
    return unique;
  }, []);

  // Initialize filters from query params
  const [filters, setFilters] = useState<PipelineFilters>(() => {
    return {
      search: searchParams.get('search') || '',
      projectId: searchParams.get('project') || 'all',
      ref: searchParams.get('ref') || 'all',
      status: (searchParams.get('status') as PipelineFilters['status']) || 'all',
      sortBy: (searchParams.get('sortBy') as PipelineFilters['sortBy']) || 'startedAt',
      sortOrder: (searchParams.get('sortOrder') as PipelineFilters['sortOrder']) || 'desc',
    };
  });

  // Sync state to URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.projectId && filters.projectId !== 'all') params.project = filters.projectId;
    if (filters.ref && filters.ref !== 'all') params.ref = filters.ref;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.sortBy && filters.sortBy !== 'startedAt') params.sortBy = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== 'desc') params.sortOrder = filters.sortOrder;

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredPipelines = useMemo(() => {
    return pipelineService.getPipelines(filters);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      projectId: 'all',
      ref: 'all',
      status: 'all',
      sortBy: 'startedAt',
      sortOrder: 'desc',
    });
  };

  const handleSortChange = (columnKey: 'startedAt' | 'durationSeconds' | 'id') => {
    setFilters((prev) => {
      const isSameColumn = prev.sortBy === columnKey;
      const newOrder = isSameColumn && prev.sortOrder === 'desc' ? 'asc' : 'desc';
      return {
        ...prev,
        sortBy: columnKey,
        sortOrder: newOrder,
      };
    });
  };

  return (
    <div className="space-y-5">
      {/* Page Heading */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Pipelines
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Filter and inspect pipeline runs across projects and branches.
        </p>
      </div>

      {/* Filter Controls */}
      <PipelineFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        projects={projects}
        availableBranches={availableBranches}
        totalMatches={filteredPipelines.length}
      />

      {/* Table or Empty State */}
      {filteredPipelines.length > 0 ? (
        <PipelineTable
          pipelines={filteredPipelines}
          onSortChange={handleSortChange}
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
        />
      ) : (
        <EmptyState
          icon={SearchX}
          title="No matching pipelines"
          description="No pipeline executions match your current filter settings. Try modifying or clearing filters."
          actionLabel="Clear all filters"
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
};
