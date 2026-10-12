import React from 'react';
import {
  Hammer,
  KeyRound,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ReleaseRecord, PipelineStatus, SigningStatus, RepackagingStatus } from '../../types/index.ts';

export interface StepItem {
  id: string;
  name: string;
  status: PipelineStatus | SigningStatus | RepackagingStatus;
  icon: React.ReactNode;
}

export function ReleaseStepper({ release }: { release: ReleaseRecord }) {
  // Determine final "Release Ready" step status
  let releaseReadyStatus: PipelineStatus = 'Pending';
  if (
    release.releaseStatus === 'Success' &&
    release.signingStatus === 'Success' &&
    release.repackagingStatus === 'Success'
  ) {
    releaseReadyStatus = 'Success';
  } else if (
    release.releaseStatus === 'Failed' ||
    release.signingStatus === 'Failed' ||
    release.repackagingStatus === 'Failed'
  ) {
    releaseReadyStatus = 'Failed';
  } else if (
    release.releaseStatus === 'Running' ||
    release.signingStatus === 'Running' ||
    release.repackagingStatus === 'Running'
  ) {
    releaseReadyStatus = 'Running';
  }

  const steps: StepItem[] = [
    {
      id: 'release-build',
      name: 'Release Build',
      status: release.releaseStatus,
      icon: <Hammer className="w-4 h-4" />,
    },
    {
      id: 'signing',
      name: 'Code Signing',
      status: release.signingStatus,
      icon: <KeyRound className="w-4 h-4" />,
    },
    {
      id: 'repackaging',
      name: 'Repackaging',
      status: release.repackagingStatus,
      icon: <PackageCheck className="w-4 h-4" />,
    },
    {
      id: 'release-ready',
      name: 'Release Ready',
      status: releaseReadyStatus,
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const getStepVisuals = (status: StepItem['status']) => {
    switch (status) {
      case 'Success':
        return {
          bg: 'bg-emerald-500 text-white',
          border: 'border-emerald-500',
          line: 'bg-emerald-500',
          badgeText: 'Success',
          badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'Running':
        return {
          bg: 'bg-blue-600 text-white animate-pulse',
          border: 'border-blue-500 ring-4 ring-blue-100',
          line: 'bg-slate-200',
          badgeText: 'Running',
          badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
        };
      case 'Failed':
        return {
          bg: 'bg-rose-500 text-white',
          border: 'border-rose-500 ring-4 ring-rose-100',
          line: 'bg-slate-200',
          badgeText: 'Failed',
          badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      case 'Pending':
      case 'Not Started':
      default:
        return {
          bg: 'bg-slate-100 text-slate-400',
          border: 'border-slate-200',
          line: 'bg-slate-200',
          badgeText: 'Not Started',
          badgeClass: 'text-slate-500 bg-slate-50 border-slate-200',
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2 relative">
        {steps.map((step, idx) => {
          const visuals = getStepVisuals(step.status);
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex flex-col items-center text-center">
              {/* Connector line between steps */}
              {!isLast && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-[2px] z-0 -translate-y-1/2 transition-colors ${
                    step.status === 'Success' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step Circle */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all duration-200 ${visuals.bg} ${visuals.border}`}
              >
                {step.icon}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-xs font-semibold text-slate-800 tracking-tight">
                {step.name}
              </div>

              {/* Step Status Pill */}
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${visuals.badgeClass}`}
                >
                  {visuals.icon}
                  <span>{step.status}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
