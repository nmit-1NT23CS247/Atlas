import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { pipelineService, PipelineFilters } from '../../services/pipelineService';
import { projectService } from '../../services/projectService';
import { PipelineListResponse } from '../../types/pipeline';
import { Project } from '../../types/project';
import { DashboardOutletContext } from '../../layouts/DashboardLayout';
import { PipelineFiltersBar } from './components/PipelineFilters';
import { PipelineTable } from './components/PipelineTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { SearchX, AlertTriangle, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const PipelinesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const outletContext = useOutletContext<DashboardOutletContext | undefined>();
  const refreshKey = outletContext?.refreshKey ?? 0;

  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from query params
  const [filters, setFilters] = useState<PipelineFilters>(() => {
    return {
      search: searchParams.get('search') || '',
      projectId: searchParams.get('project') || 'all',
      ref: searchParams.get('ref') || 'all',
      status: (searchParams.get('status') as PipelineFilters['status']) || 'all',
      sortBy: (searchParams.get('sortBy') as PipelineFilters['sortBy']) || 'startedAt',
      sortOrder: (searchParams.get('sortOrder') as PipelineFilters['sortOrder']) || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10) || 1,
      pageSize: parseInt(searchParams.get('pageSize') || '25', 10) || 25,
    };
  });

  // Sync filter state to URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.projectId && filters.projectId !== 'all') params.project = filters.projectId;
    if (filters.ref && filters.ref !== 'all') params.ref = filters.ref;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.sortBy && filters.sortBy !== 'startedAt') params.sortBy = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== 'desc') params.sortOrder = filters.sortOrder;
    if (filters.page && filters.page > 1) params.page = String(filters.page);
    if (filters.pageSize && filters.pageSize !== 25) params.pageSize = String(filters.pageSize);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load projects list for dropdown filter
  useEffect(() => {
    let active = true;
    projectService
      .getProjects(false)
      .then((items) => {
        if (active) setProjects(items);
      })
      .catch(() => {
        // Silently continue if project metadata list fails
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch pipelines matching current filters
  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pipelineService.getPipelines(filters);
      setPipelineData(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load pipelines';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines, refreshKey]);

  // Compute available branches from projects & current results
  const availableBranches = useMemo(() => {
    const refs = new Set<string>();
    projects.forEach((p) => {
      if (p.defaultBranch) refs.add(p.defaultBranch);
    });
    if (pipelineData) {
      pipelineData.items.forEach((p) => {
        if (p.ref) refs.add(p.ref);
      });
    }
    return Array.from(refs).sort();
  }, [projects, pipelineData]);

  const handleFilterChange = (updated: PipelineFilters) => {
    setFilters((prev) => ({
      ...updated,
      page: 1, // Reset page when query criteria change
      pageSize: prev.pageSize,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      projectId: 'all',
      ref: 'all',
      status: 'all',
      sortBy: 'startedAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: filters.pageSize,
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
        page: 1,
      };
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({
      ...prev,
      pageSize: newPageSize,
      page: 1,
    }));
  };

  const pagination = pipelineData?.pagination;
  const pipelines = pipelineData?.items || [];
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? (filters.page || 1);
  const pageSize = pagination?.pageSize ?? (filters.pageSize || 25);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

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
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        projects={projects}
        availableBranches={availableBranches}
        totalMatches={totalItems}
      />

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={fetchPipelines}
            icon={<RotateCw className="w-3 h-3" />}
            className="hover:border-rose-300 hover:text-rose-700 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !pipelineData && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs animate-pulse">
          Loading pipelines from server...
        </div>
      )}

      {/* Table or Empty State */}
      {pipelineData && (
        <>
          {pipelines.length > 0 ? (
            <div className="space-y-4">
              <PipelineTable
                pipelines={pipelines}
                onSortChange={handleSortChange}
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
              />

              {/* Minimal Usable Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <strong className="font-mono text-slate-800">{startItem}</strong> to{' '}
                    <strong className="font-mono text-slate-800">{endItem}</strong> of{' '}
                    <strong className="font-mono text-slate-800">{totalItems}</strong> pipelines
                  </span>

                  <span className="text-slate-300 hidden sm:inline">|</span>

                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Per page:</span>
                    <Select
                      options={[
                        { value: '10', label: '10' },
                        { value: '25', label: '25' },
                        { value: '50', label: '50' },
                        { value: '100', label: '100' },
                      ]}
                      value={String(pageSize)}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                      className="h-7 text-xs py-0.5 px-2 w-16"
                    />
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="font-mono text-slate-700">
                    Page <strong>{currentPage}</strong> of <strong>{Math.max(totalPages, 1)}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={currentPage <= 1 || loading}
                      onClick={() => handlePageChange(currentPage - 1)}
                      icon={<ChevronLeft className="w-3.5 h-3.5" />}
                      aria-label="Previous page"
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={currentPage >= totalPages || loading}
                      onClick={() => handlePageChange(currentPage + 1)}
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                      aria-label="Next page"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No matching pipelines"
              description="No pipeline executions match your current filter settings. Try modifying or clearing filters."
              actionLabel="Clear all filters"
              onAction={handleResetFilters}
            />
          )}
        </>
      )}
    </div>
  );
};
