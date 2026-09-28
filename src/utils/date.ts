/**
 * @file date.ts
 * @description Standardized date utilities.
 * Timestamps stored in UTC, rendered for users in Asia/Kolkata (IST).
 */

export function formatToKolkataTime(
  utcIsoString: string,
  options: { includeSeconds?: boolean; dateOnly?: boolean } = {}
): string {
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return utcIsoString;

    if (options.dateOnly) {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(date) + ' IST';
  } catch (error) {
    return utcIsoString;
  }
}

export function getCurrentUtcIso(): string {
  return new Date().toISOString();
}
