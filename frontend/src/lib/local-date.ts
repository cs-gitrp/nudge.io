/**
 * Client-side helper for computing "today" (or N days ago) as a local YYYY-MM-DD
 * string, for display and date-input purposes only (e.g. highlighting today's cell,
 * capping the backfill date picker). This mirrors backend/src/streak/local-day.ts's
 * conversion logic but intentionally lives separately: this file is presentation-only
 * and must never be used to decide streaks or validate a check-in — the server is the
 * sole source of truth for both. See habit-server-utils.ts / streak.ts for the
 * authoritative version.
 */
export const getRelativeLocalDateString = (daysAgo: number, timezone?: string): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);

  if (timezone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    } catch (e) {
      console.warn('Invalid timezone, falling back to browser local time', e);
    }
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
