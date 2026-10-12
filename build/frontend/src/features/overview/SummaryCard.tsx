import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  variant: 'orange-pink' | 'blue-cyan' | 'teal-green';
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
}: SummaryCardProps) {
  const gradientStyles = {
    'orange-pink': 'from-[#FF5E62] to-[#FF9966]',
    'blue-cyan': 'from-[#2563EB] to-[#06B6D4]',
    'teal-green': 'from-[#0D9488] to-[#10B981]',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientStyles[variant]} p-6 text-white shadow-md transition-all duration-150 hover:shadow-lg`}
    >
      {/* Translucent circle decorations in the corner */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/15 pointer-events-none" />
      <div className="absolute right-6 -top-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
            {title}
          </p>
          <div className="text-3xl font-bold mt-2 tracking-tight tabular-nums font-mono">
            {value}
          </div>
          <p className="text-xs text-white/90 mt-2 flex items-center gap-1.5 font-medium">
            <span>{subtitle}</span>
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
          <Icon className="w-6 h-6 stroke-[2]" />
        </div>
      </div>
    </div>
  );
}
