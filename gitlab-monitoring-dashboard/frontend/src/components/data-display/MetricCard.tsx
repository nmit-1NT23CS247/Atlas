import React from 'react';
import { Card } from '../ui/Card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  statusVariant?: 'default' | 'success' | 'danger' | 'info' | 'warning';
  trend?: {
    diff: number;
    label: string;
    isPositiveGood?: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  description,
  statusVariant = 'default',
  trend,
}) => {
  const iconColorStyles = {
    default: 'bg-blue-50/80 text-blue-600 border-blue-100',
    success: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
    danger: 'bg-rose-50/80 text-rose-600 border-rose-100',
    info: 'bg-sky-50/80 text-sky-600 border-sky-100',
    warning: 'bg-amber-50/80 text-amber-600 border-amber-100',
  }[statusVariant];

  return (
    <Card className="p-4 relative overflow-hidden transition-all duration-200 hover:border-blue-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {value}
            </span>
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-mono font-medium ${
                  (trend.diff >= 0 && trend.isPositiveGood !== false) ||
                  (trend.diff < 0 && trend.isPositiveGood === false)
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {trend.diff >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                )}
                {trend.diff > 0 ? `+${trend.diff}` : trend.diff}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1.5 truncate">{description}</p>
          )}
        </div>
        <div
          className={`p-2.5 rounded-lg border shrink-0 flex items-center justify-center ${iconColorStyles}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};
