import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { NAVIGATION_ITEMS, APP_CONFIG } from '../../config/navigation.ts';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8E54E9] to-[#B66DFF] flex items-center justify-center text-white shadow-sm shrink-0">
            <Workflow className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 tracking-tight truncate">
                {APP_CONFIG.name}
              </span>
              <span className="text-[11px] font-medium text-slate-400 truncate">
                GitLab CI/CD Console
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Modules
            </div>
          )}
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive: navActive }) => {
                    const active = isActive || navActive;
                    return `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-[#F4F1FA] text-[#8E54E9] font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`;
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#8E54E9] stroke-[2.2]'
                        : 'text-slate-400 group-hover:text-slate-600 stroke-[1.75]'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-500">v{APP_CONFIG.version}</span>
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Mock Mode
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-slate-400">
            <Boxes className="w-4 h-4" />
          </div>
        )}
      </div>
    </aside>
  );
}
