import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatRelativeTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return isoString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return isoString;
    return format(date, 'MMM d, yyyy HH:mm:ss');
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return isoString;
    return format(date, 'MMM d, yyyy');
  } catch {
    return isoString;
  }
}

export function formatDayMonth(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return isoString;
    return format(date, 'MMM d');
  } catch {
    return isoString;
  }
}
