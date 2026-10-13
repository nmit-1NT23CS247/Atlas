import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'primary' | 'info' | 'success' | 'warning' | 'orange-pink' | 'blue-cyan' | 'teal-green' | 'default';
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: SummaryCardProps) {
  // Restrained semantic accent styling for the icon badge
  const badgeStyles: Record<string, string> = {
    primary: 'bg-[#F4F1FA] text-[#7C3AED] border border-[#7C3AED]/20',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    default: 'bg-[#F4F1FA] text-[#7C3AED] border border-[#7C3AED]/20',
    // Backward-compatible aliases
    'orange-pink': 'bg-amber-50 text-amber-700 border border-amber-200/60',
    'blue-cyan': 'bg-blue-50 text-blue-700 border border-blue-200/60',
    'teal-green': 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  };

  const badgeClass = badgeStyles[variant] || badgeStyles['default'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 transition-all duration-150 hover:border-[#7C3AED]/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="text-3xl font-bold mt-2 tracking-tight tabular-nums font-mono text-slate-900">
            {value}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium truncate">
            <span>{subtitle}</span>
          </p>
        </div>

        <div className={`p-2.5 rounded-xl shrink-0 ${badgeClass}`}>
          <Icon className="w-5 h-5 stroke-[2]" />
        </div>
      </div>
    </div>
  );
}
