/**
 * Format date to standard readable string
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Format time to hh:mm:ss
 */
export function formatTime(date: Date | string = new Date()): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toTimeString().split(' ')[0];
  } catch {
    return '--:--:--';
  }
}

/**
 * Format full datetime: "Oct 12, 2026 14:32:05"
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `${date} ${time}`;
  } catch {
    return isoString;
  }
}

/**
 * Human relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

/**
 * Short SHA (first 8 characters)
 */
export function shortenSha(sha: string): string {
  if (!sha) return '';
  return sha.slice(0, 8);
}
