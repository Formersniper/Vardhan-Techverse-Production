/**
 * Vardhan Techverse Private Limited
 * Date & Time Utility Contract (V1.0)
 * 
 * Rules:
 * 1. Backend & database storage: strictly UTC ISO 8601 strings.
 * 2. Client & operator presentation: strictly Asia/Kolkata (IST, UTC+05:30).
 */

export const OPERATIONAL_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current timestamp in UTC ISO 8601 format.
 * Format: YYYY-MM-DDTHH:mm:ss.sssZ
 */
export function getCurrentUtcIsoString(): string {
  return new Date().toISOString();
}

/**
 * Formats a UTC ISO timestamp for display to users and operators in Asia/Kolkata timezone.
 * Example output: "26 Sep 2026, 03:45 PM IST"
 */
export function formatToKolkataTime(
  utcTimestamp: string | Date | null | undefined,
  options?: {
    includeSeconds?: boolean;
    dateOnly?: boolean;
    timeOnly?: boolean;
  }
): string {
  if (!utcTimestamp) return '—';

  const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
  if (isNaN(date.getTime())) return 'Invalid Date';

  if (options?.dateOnly) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: OPERATIONAL_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  if (options?.timeOnly) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: OPERATIONAL_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(date);
  }

  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: OPERATIONAL_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: options?.includeSeconds ? '2-digit' : undefined,
    hour12: true,
  }).format(date);

  return `${formatted} IST`;
}

/**
 * Formats UTC timestamp into a relative or compact human-readable date.
 * Example: "Today at 02:30 PM IST" or "26 Sep 2026"
 */
export function formatCompactKolkata(utcTimestamp: string | Date | null | undefined): string {
  if (!utcTimestamp) return '—';
  const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: OPERATIONAL_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
