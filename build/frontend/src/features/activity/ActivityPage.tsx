import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { ActivityTable } from './ActivityTable.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { TableSkeletonRows } from '../../components/ui/Skeleton.tsx';
import { ErrorBanner } from '../../components/common/ErrorBanner.tsx';
import { getActivity } from '../../services/activity.ts';
import { getBranches } from '../../services/products.ts';
import { AuditEntry, Branch } from '../../types/index.ts';

export function ActivityPage() {
  const { products, selectedProductId, refreshTick } = useDashboard();

  const [activities, setActivities] = useState<AuditEntry[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters: product, branch, action, status, date range, query
  const [productFilter, setProductFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load branches
  useEffect(() => {
    let isMounted = true;
    async function loadBranchList() {
      try {
        const b = await getBranches(selectedProductId);
        if (isMounted) setBranches(b);
      } catch (err) {
        console.error('Failed to load branches for filter', err);
      }
    }
    loadBranchList();
    return () => {
      isMounted = false;
    };
  }, [selectedProductId]);

  // Load activity with filters
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getActivity({
          product: productFilter,
          branch: branchFilter,
          action: actionFilter as any,
          status: statusFilter as any,
          query: searchQuery,
          dateRange: dateRangeFilter,
        });

        if (!isMounted) return;
        setActivities(data);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to fetch audit log entries');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [productFilter, branchFilter, actionFilter, statusFilter, dateRangeFilter, searchQuery, refreshTick]);

  // CSV export handler
  const handleExportCSV = () => {
    if (activities.length === 0) return;
    const headers = ['Timestamp', 'User', 'Action', 'Product', 'Branch', 'Commit', 'Version', 'Outcome'];
    const rows = activities.map((a) => [
      a.timestamp,
      `"${a.user}"`,
      `"${a.action}"`,
      a.product,
      a.branch,
      a.commit,
      a.version,
      a.outcome,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gitlab_ci_activity_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Activity & Compliance Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Read-only chronological audit trail of all build triggers, promotions, and release actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(115,82,199,0.04)] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by user, commit, version..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product filter */}
          <div className="w-32">
            <Select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="All">Product: All</option>
              {products.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code}
                </option>
              ))}
            </Select>
          </div>

          {/* Branch filter */}
          <div className="w-36">
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="All">Branch: All</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Action filter */}
          <div className="w-36">
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="All">Action: All</option>
              <option value="Build">Build</option>
              <option value="Promote Stable">Promote Stable</option>
              <option value="Release">Release</option>
            </Select>
          </div>

          {/* Status filter */}
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status: All</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="In Progress">In Progress</option>
            </Select>
          </div>

          {/* Date range filter */}
          <div className="w-36">
            <Select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="all">Date: All</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Activity Table */}
      {isLoading && activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <TableSkeletonRows rows={7} cols={8} />
        </div>
      ) : (
        <ActivityTable activities={activities} />
      )}
    </div>
  );
}
