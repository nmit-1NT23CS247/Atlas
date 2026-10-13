import React, { useState, useEffect } from 'react';
import { Rocket, ShieldCheck, GitBranch, Layers, AlertCircle } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { StableRecord } from '../../types/index.ts';
import { createRelease } from '../../services/releases.ts';
import { useDashboard } from '../../hooks/useDashboardContext.tsx';
import { shortenSha } from '../../utils/formatters.ts';

export interface CreateReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  stableRecords: StableRecord[];
  initialStableBuildId?: string;
  onReleaseCreated: () => void;
}

export function CreateReleaseModal({
  isOpen,
  onClose,
  stableRecords,
  initialStableBuildId,
  onReleaseCreated,
}: CreateReleaseModalProps) {
  const { currentProduct, role, canCreateRelease, getRolePermissionReason } = useDashboard();
  const [selectedStableId, setSelectedStableId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStableBuildId && stableRecords.some((s) => s.id === initialStableBuildId)) {
      setSelectedStableId(initialStableBuildId);
    } else if (stableRecords.length > 0) {
      setSelectedStableId(stableRecords[0].id);
    }
  }, [initialStableBuildId, stableRecords]);

  if (!isOpen) return null;

  const selectedStable = stableRecords.find((s) => s.id === selectedStableId) || stableRecords[0];

  const handleConfirm = async () => {
    if (!selectedStable) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await createRelease(selectedStable.id, `${role} Officer`);
      onReleaseCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize release pipeline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleReason = getRolePermissionReason('release');

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Release Build from Stable"
      description="Launch multi-stage signing, binary packaging, and distribution readiness workflow"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canCreateRelease || !selectedStable || isSubmitting}
            isLoading={isSubmitting}
            onClick={handleConfirm}
            tooltip={roleReason || undefined}
            leftIcon={<Rocket className="w-3.5 h-3.5" />}
          >
            Start Release Build
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Select Source Stable Build
          </label>
          <Select
            value={selectedStableId}
            onChange={(e) => setSelectedStableId(e.target.value)}
          >
            {stableRecords.map((s) => (
              <option key={s.id} value={s.id}>
                {s.version} — Branch: {s.branch} (Commit: {shortenSha(s.commitSha)})
              </option>
            ))}
          </Select>
        </div>

        {selectedStable && (
          <div className="p-4 rounded-xl bg-[#F4F1FA] border border-[#7C3AED]/20 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
                Product:
              </span>
              <strong className="text-slate-800">{currentProduct?.name}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#7C3AED]" />
                Source Branch:
              </span>
              <strong className="text-slate-800 font-mono">{selectedStable.branch}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                Stable Version:
              </span>
              <strong className="text-[#7C3AED] font-mono">{selectedStable.version}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Release Artifact:</span>
              <strong className="font-mono text-emerald-700">
                {selectedStable.version.replace('-stable', '')}-GA
              </strong>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-normal">
          This initiates the release progression: <br />
          <strong>1. Release Build</strong> &rarr; <strong>2. HSM Code Signing</strong> &rarr;{' '}
          <strong>3. Container Repackaging</strong> &rarr; <strong>4. Release Ready</strong>
        </div>
      </div>
    </Dialog>
  );
}
