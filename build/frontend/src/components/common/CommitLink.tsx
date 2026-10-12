import React from 'react';
import { ExternalLink, GitCommit } from 'lucide-react';
import { shortenSha } from '../../utils/formatters.ts';

export function CommitLink({
  sha,
  gitlabUrl,
  className = '',
}: {
  sha: string;
  gitlabUrl?: string;
  className?: string;
}) {
  const shortSha = shortenSha(sha);
  const targetUrl = gitlabUrl || `https://gitlab.internal.corp/commit/${sha}`;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mono text-xs font-medium text-[#8E54E9] hover:text-[#763fd0] hover:underline transition-colors ${className}`}
      title={`Open commit ${sha} on GitLab`}
    >
      <GitCommit className="w-3.5 h-3.5 opacity-70" />
      <span>{shortSha}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
    </a>
  );
}

export function PipelineLink({
  pipelineId,
  gitlabUrl,
  className = '',
}: {
  pipelineId: string;
  gitlabUrl?: string;
  className?: string;
}) {
  const targetUrl = gitlabUrl || `https://gitlab.internal.corp/pipelines/${pipelineId}`;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mono text-xs text-slate-600 hover:text-slate-900 hover:underline transition-colors ${className}`}
      title={`Open GitLab pipeline #${pipelineId}`}
    >
      <span>#{pipelineId.replace('pl-', '')}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
    </a>
  );
}
