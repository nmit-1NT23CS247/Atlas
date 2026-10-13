export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 0) return '0s';
  if (seconds === 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export function formatCommitSha(sha: string, length = 8): string {
  if (!sha) return '';
  return sha.slice(0, length);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatSourceLabel(source: string): string {
  switch (source) {
    case 'merge_request_event':
      return 'Merge Request';
    case 'push':
      return 'Git Push';
    case 'schedule':
      return 'Scheduled Cron';
    case 'web':
      return 'Web UI';
    case 'api':
      return 'REST API';
    case 'trigger':
      return 'Pipeline Trigger';
    default:
      return source;
  }
}
