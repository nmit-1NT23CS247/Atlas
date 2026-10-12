import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';

export function LastRefreshed({
  timestamp,
  onRefresh,
  className = '',
}: {
  timestamp?: string;
  onRefresh?: () => void;
  className?: string;
}) {
  const { lastRefreshed: globalTime, triggerRefresh: globalRefresh } = useDashboard();
  const [isRotating, setIsRotating] = useState(false);

  const displayTime = timestamp || globalTime;

  const handleRefresh = () => {
    setIsRotating(true);
    if (onRefresh) {
      onRefresh();
    } else {
      globalRefresh();
    }
    setTimeout(() => setIsRotating(false), 600);
  };

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-xs ${className}`}
    >
      <span className="tabular-nums">
        Last refreshed: <strong className="font-semibold text-slate-700">{displayTime}</strong>
      </span>
      <button
        onClick={handleRefresh}
        title="Refresh now (auto-refreshes every 15s for active pipelines)"
        className="p-1 rounded-lg text-slate-400 hover:text-[#8E54E9] hover:bg-[#F4F1FA] transition-colors cursor-pointer"
        aria-label="Refresh data"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-[#8E54E9]' : ''}`} />
      </button>
    </div>
  );
}
