import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className = '' }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-rose-900">Operation Error</h4>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed font-mono break-all">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="bg-white/80 border-rose-300 text-rose-800 hover:bg-white shrink-0"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
