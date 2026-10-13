import React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-slate-200/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F4F1FA] flex items-center justify-center text-[#7C3AED] mb-4 shadow-xs">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
