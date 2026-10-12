import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Database,
  X,
} from 'lucide-react';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      to: '/pipelines',
      label: 'Pipelines',
      icon: GitBranch,
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderKanban,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md border-r border-slate-200/90 shadow-[2px_0_12px_rgba(37,99,235,0.02)] select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-15 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Abstract Pipeline / Network Mark */}
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs shrink-0">
            <svg
              className="w-4.5 h-4.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="5" cy="6" r="2.5" />
              <circle cx="19" cy="6" r="2.5" />
              <circle cx="12" cy="18" r="2.5" />
              <path d="M7.5 6h9" />
              <path d="M6.5 8.5l4 7" />
              <path d="M17.5 8.5l-4 7" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 truncate">
                Pipeline Monitoring
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                GitLab CI/CD
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  collapsed ? 'mx-auto' : ''
                }`}
              />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {/* Environment Indicator */}
        {!collapsed ? (
          <div className="px-2.5 py-1.5 bg-blue-50/60 border border-blue-100/80 rounded-lg text-slate-700">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-800">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Demo Mode</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              Local prototype records
            </p>
          </div>
        ) : (
          <div
            className="w-full flex justify-center py-1.5 text-blue-600"
            title="Demo Mode: Local prototype"
          >
            <Database className="w-4 h-4" />
          </div>
        )}

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden md:flex justify-end pt-1">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div
          className="fixed top-0 bottom-0 left-0 z-30 transition-all duration-200 ease-in-out"
          style={{ width: collapsed ? '4rem' : '15rem' }}
        >
          {content}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};
