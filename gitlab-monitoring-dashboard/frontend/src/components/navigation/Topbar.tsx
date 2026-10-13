import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';
import { Input } from '../ui/Input';
import {
  Search,
  RefreshCw,
  Menu,
  ExternalLink,
} from 'lucide-react';
import { pipelineService } from '../../services/pipelineService';

import { Pipeline } from '../../types/pipeline';

export interface TopbarProps {
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshed: Date;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onRefresh,
  isRefreshing,
  lastRefreshed,
}) => {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [matchingPipelines, setMatchingPipelines] = useState<Pipeline[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const term = globalSearch.trim();
    if (!term) {
      setMatchingPipelines([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await pipelineService.getPipelines({ search: term, pageSize: 4 });
        setMatchingPipelines(response.items);
      } catch {
        setMatchingPipelines([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  return (
    <header className="sticky top-0 z-20 h-15 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between h-full px-4 md:px-6 gap-4">
        {/* Left: Mobile Toggle + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg -ml-1 transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumbs />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search */}
          <div ref={searchContainerRef} className="relative hidden sm:block w-52 md:w-64">
            <Input
              icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              placeholder="Search pipelines..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              clearable
              onClear={() => setGlobalSearch('')}
              className="h-8 text-xs bg-slate-50/80 border-slate-200 focus:bg-white"
            />

            {/* Quick Search Dropdown */}
            {searchOpen && globalSearch.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50 text-xs">
                <div className="p-2 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pipelines ({matchingPipelines.length})
                </div>
                {matchingPipelines.length > 0 ? (
                  <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                    {matchingPipelines.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          navigate(`/pipelines/${p.id}`);
                          setSearchOpen(false);
                          setGlobalSearch('');
                        }}
                        className="w-full text-left p-2.5 hover:bg-blue-50/60 flex items-center justify-between transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                            #{p.id} · {p.projectName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {p.commitTitle}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {p.status}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-500 text-xs">
                    No pipelines matching "{globalSearch}"
                  </div>
                )}
                <div className="p-1.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      navigate(`/pipelines?search=${encodeURIComponent(globalSearch)}`);
                      setSearchOpen(false);
                    }}
                    className="text-[11px] text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    View in Pipelines Table
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* API Connection Indicator */}
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-md">
            API Connected
          </span>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg transition-all shadow-2xs hover:border-blue-200 active:bg-slate-100"
            title={`Refreshed: ${lastRefreshed.toLocaleTimeString()}`}
            aria-label="Refresh pipeline records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${
                isRefreshing ? 'animate-spin text-blue-600' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
