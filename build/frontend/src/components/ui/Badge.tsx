import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'success' | 'failed' | 'running' | 'pending' | 'canceled' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    failed: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    running: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    canceled: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    purple: 'bg-[#F4F1FA] text-[#8E54E9] border border-[#8E54E9]/20',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full leading-none whitespace-nowrap select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
