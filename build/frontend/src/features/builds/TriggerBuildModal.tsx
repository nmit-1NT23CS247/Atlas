import React, { useState } from 'react';
import { Hammer, GitCommit, GitBranch, Layers, AlertCircle } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Commit } from '../../types/index.ts';
import { shortenSha } from '../../utils/formatters.ts';

export interface TriggerBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  commit: Commit | null;
  productName: string;
  productCode: string;
  onConfirmBuild: (commit: Commit) => Promise<void>;
}

export function TriggerBuildModal({
  isOpen,
  onClose,
  commit,
  productName,
  productCode,
  onConfirmBuild,
}: TriggerBuildModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!commit) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmBuild(commit);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch build job to GitLab runners');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Trigger GitLab CI/CD Build"
      description="Queue an automated build job and pipeline execution on runner cluster"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleConfirm}
            leftIcon={<Hammer className="w-3.5 h-3.5" />}
          >
            Trigger Build Now
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-[#F4F1FA] border border-[#8E54E9]/20 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8E54E9]" />
              Target Product:
            </span>
            <span className="font-semibold text-slate-800">
              {productCode} — {productName}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[#8E54E9]" />
              Target Branch:
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {commit.branch}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-[#8E54E9]" />
              Commit SHA:
            </span>
            <span className="font-mono text-[#8E54E9] font-bold">
              {shortenSha(commit.sha)} ({commit.sha})
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
          <span className="text-slate-400 block text-[11px] mb-1 font-medium">
            Commit Message:
          </span>
          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            {commit.message}
          </p>
          <div className="mt-2 text-[11px] text-slate-400">
            Authored by <strong className="text-slate-600">{commit.authorName}</strong>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          This will trigger a standard multi-stage GitLab pipeline including static
          analysis, container build, and unit/integration verification stages.
        </p>
      </div>
    </Dialog>
  );
}
