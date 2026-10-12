import React from 'react';
import {
  Search,
  Layers,
  UserCheck,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { LastRefreshed } from '../common/LastRefreshed.tsx';
import { UserRole } from '../../types/index.ts';

export function Topbar() {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    role,
    setRole,
    searchQuery,
    setSearchQuery,
    lastRefreshed,
    triggerRefresh,
    currentProduct,
  } = useDashboard();

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left Zone: Product Selector & Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#8E54E9] shrink-0" />
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="font-semibold text-slate-800 text-sm bg-transparent border-0 pr-6 py-1 focus:ring-0 focus:outline-none cursor-pointer truncate"
              title="Select Active Product"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentProduct?.gitlabUrl && (
          <a
            href={currentProduct.gitlabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#8E54E9] transition-colors"
            title="View product project on GitLab"
          >
            <span>Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Center Zone: Search Box */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commits, versions, SHA, or authors..."
            className="w-full h-9 pl-9 pr-4 text-xs rounded-xl bg-[#F4F1FA]/70 border border-transparent focus:border-[#8E54E9]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8E54E9]/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Zone: Refresh + Role Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <LastRefreshed timestamp={lastRefreshed} onRefresh={triggerRefresh} />

        {/* Demo Role Switcher
            NOTE: Real authorization policies, access control lists (RBAC), and user
            tokens are strictly validated and enforced by the server-side backend API.
            The client-side role switcher below is provided for demo testing and UX evaluation.
        */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-[#F4F1FA] px-2.5 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-[#8E54E9]" />
            <span className="text-slate-400">Demo role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              title="Switch demo role to test permission gates for action buttons"
            >
              <option value="Developer">Developer</option>
              <option value="QA">QA</option>
              <option value="Release Engineer">Release Engineer</option>
            </select>
            <span
              title="Developer: Can build&#10;QA: Can build & promote stable&#10;Release Engineer: Can build, promote & release"
              className="cursor-help text-slate-400 hover:text-slate-600"
            >
              <Info className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
