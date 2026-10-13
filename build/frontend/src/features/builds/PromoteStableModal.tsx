import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  GitBranch,
  Layers,
} from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Commit, EligibilityCheck } from '../../types/index.ts';
import { getStableEligibility, promoteStable } from '../../services/stable.ts';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { shortenSha } from '../../utils/formatters.ts';

export interface PromoteStableModalProps {
  isOpen: boolean;
  onClose: () => void;
  commit?: Commit | null;
  candidateCommits?: Commit[];
  onPromoted: () => void;
}

export function PromoteStableModal({
  isOpen,
  onClose,
  commit = null,
  candidateCommits,
  onPromoted,
}: PromoteStableModalProps) {
  const { currentProduct, role } = useDashboard();
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(commit);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState<boolean>(true);
  const [checklist, setChecklist] = useState<EligibilityCheck[]>([]);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Sync selectedCommit when modal opens or commit/candidateCommits changes
  useEffect(() => {
    if (commit) {
      setSelectedCommit(commit);
    } else if (candidateCommits && candidateCommits.length > 0) {
      setSelectedCommit(candidateCommits[0]);
    } else {
      setSelectedCommit(null);
    }
  }, [commit, candidateCommits, isOpen]);

  // Evaluate eligibility whenever selectedCommit changes while open
  useEffect(() => {
    let isMounted = true;
    async function evaluate() {
      if (!selectedCommit?.buildId) {
        setIsLoadingChecklist(false);
        setChecklist([]);
        setIsEligible(false);
        return;
      }
      try {
        setIsLoadingChecklist(true);
        setBackendError(null);
        const res = await getStableEligibility(selectedCommit.buildId);
        if (isMounted) {
          setChecklist(res.checks);
          setIsEligible(res.eligible);
        }
      } catch (err: any) {
        if (isMounted) {
          setBackendError(err?.message || 'Failed to evaluate eligibility');
        }
      } finally {
        if (isMounted) setIsLoadingChecklist(false);
      }
    }

    if (isOpen && selectedCommit) {
      evaluate();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedCommit]);

  const handleConfirmPromotion = async () => {
    if (!selectedCommit?.buildId) return;
    try {
      setIsSubmitting(true);
      setBackendError(null);

      // Call promotion API
      await promoteStable(selectedCommit.buildId, `${role} Operator`);
      onPromoted();
      onClose();
    } catch (err: any) {
      // Gracefully handle backend rejecting the request and show its reason clearly
      setBackendError(err?.message || 'Promotion rejected by the server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allPassed = Boolean(
    isEligible &&
    checklist.length > 0 &&
    checklist.every((c) => c.passed) &&
    selectedCommit?.buildId
  );

  if (!isOpen) return null;

  const showCandidatePicker = Boolean(candidateCommits && candidateCommits.length > 0 && !commit);
  const hasCandidates = Boolean(selectedCommit || (candidateCommits && candidateCommits.length > 0));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Build to Stable"
      description="Validate mandatory CI gates and register this build as the official Stable baseline"
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!allPassed || isSubmitting || !hasCandidates}
            isLoading={isSubmitting}
            onClick={handleConfirmPromotion}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            tooltip={!allPassed ? 'All eligibility criteria must pass before promoting' : undefined}
          >
            Confirm Promotion
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Backend Error Banner */}
        {backendError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Promotion Failed</strong>
              <span className="leading-relaxed">{backendError}</span>
            </div>
          </div>
        )}

        {/* Candidate Selector (if opened from Stable page with candidate list) */}
        {showCandidatePicker && candidateCommits && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Select Build Candidate to Promote
            </label>
            <Select
              value={selectedCommit?.sha || ''}
              onChange={(e) => {
                const found = candidateCommits.find((c) => c.sha === e.target.value);
                if (found) setSelectedCommit(found);
              }}
              title="Select Candidate Build"
            >
              {candidateCommits.map((c) => (
                <option key={c.sha} value={c.sha}>
                  [{c.branch}] {c.version || shortenSha(c.sha)} — {c.authorName} ({shortenSha(c.sha)})
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-slate-500">
              Only builds with successful CI pipelines not currently marked as Stable can be evaluated.
            </p>
          </div>
        )}

        {/* No Candidates Fallback */}
        {!hasCandidates ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No builds currently qualify for Stable promotion on this product. (Requires pipeline status Success).
          </div>
        ) : selectedCommit ? (
          <>
            {/* Target Meta */}
            <div className="p-3.5 rounded-xl bg-[#F4F1FA] border border-[#7C3AED]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="font-medium text-slate-600">Product:</span>
                <strong className="text-slate-800">{currentProduct?.code}</strong>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="font-medium text-slate-600">Branch:</span>
                <strong className="text-slate-800 font-mono">{selectedCommit.branch}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">Version:</span>
                <strong className="text-[#7C3AED] font-mono">{selectedCommit.version || 'Pending'}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">SHA:</span>
                <strong className="font-mono">{shortenSha(selectedCommit.sha)}</strong>
              </div>
            </div>

        {/* Eligibility Checklist */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Backend Eligibility Criteria Checklist
          </h4>

          {isLoadingChecklist ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
              <span className="text-xs">Evaluating policy invariants & pipeline test reports...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                    item.passed
                      ? 'bg-emerald-50/50 border-emerald-200/60'
                      : 'bg-rose-50/50 border-rose-200/60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.status === 'Passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : item.status === 'Pending' ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : item.status === 'Not Checked' ? (
                      <Clock className="w-4 h-4 text-slate-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          item.status === 'Passed'
                            ? 'text-emerald-900'
                            : item.status === 'Pending'
                            ? 'text-blue-900'
                            : item.status === 'Not Checked'
                            ? 'text-slate-700'
                            : 'text-rose-900'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          item.status === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Pending'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'Not Checked'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 leading-relaxed ${
                        item.status === 'Passed'
                          ? 'text-emerald-700'
                          : item.status === 'Pending'
                          ? 'text-blue-700'
                          : item.status === 'Not Checked'
                          ? 'text-slate-500'
                          : 'text-rose-700'
                      }`}
                    >
                      {item.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRD Architectural Notice */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Backend Policy Representation</span>
          </div>
          <p className="leading-relaxed">
            These checks reflect server-evaluated eligibility results reported by the backend API.
            The frontend displays this assessment and delegates authoritative promotion enforcement
            to the server. (Mock mode simulates this transition for review).
          </p>
        </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
