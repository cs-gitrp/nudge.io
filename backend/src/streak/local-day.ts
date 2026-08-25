/**
 * All "what calendar day does this instant fall on, for this user" logic lives here.
 * Nothing in this file talks to the DB or HTTP layer — it's pure functions over
 * Date + IANA timezone strings, so it's trivially unit-testable and there is exactly
 * one place in the codebase that can get local-day math wrong.
 *
 * Local days are represented as plain "YYYY-MM-DD" strings. We deliberately do NOT
 * represent them as Date objects, because a Date is always an instant in UTC internally —
 * re-wrapping a calendar day in a Date reintroduces the exact timezone ambiguity we're
 * trying to eliminate. String comparison ("2026-03-11" < "2026-03-12") is safe, exact,
 * and immune to DST.
 */

const LOCAL_DAY_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = LOCAL_DAY_FORMATTER_CACHE.get(timezone);
  if (!formatter) {
    // en-CA locale formats as YYYY-MM-DD natively, which is exactly the shape we want.
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    LOCAL_DAY_FORMATTER_CACHE.set(timezone, formatter);
  }
  return formatter;
}

/**
 * Validates that a string is a real IANA timezone identifier Intl can resolve.
 * Throws if not — call this at signup / timezone-change time, not on every read.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Given a UTC instant and an IANA timezone, returns the local calendar day
 * as "YYYY-MM-DD". This is the single conversion point for the whole app.
 */
export function getLocalDateString(instant: Date, timezone: string): string {
  return getFormatter(timezone).format(instant);
}

/**
 * Returns "today" as a local date string in the given timezone, evaluated at the
 * moment this function runs (server clock, converted — not the client's clock).
 */
export function todayLocalDateString(timezone: string, now: Date = new Date()): string {
  return getLocalDateString(now, timezone);
}

/**
 * Adds/subtracts whole days to a "YYYY-MM-DD" string and returns a new "YYYY-MM-DD"
 * string. Works by parsing as a UTC midnight instant purely as a calculation anchor
 * (never shown to the user, never compared against a real instant) — this keeps the
 * arithmetic immune to the *server's* local timezone and to DST, since we only ever
 * add whole UTC days to a UTC-midnight anchor and re-read the UTC calendar fields.
 */
export function addDaysToLocalDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  anchor.setUTCDate(anchor.getUTCDate() + days);
  const yyyy = anchor.getUTCFullYear();
  const mm = String(anchor.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(anchor.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Lexicographic compare works because the format is fixed-width YYYY-MM-DD. */
export function compareLocalDateStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isLocalDateInFuture(dateStr: string, timezone: string, now: Date = new Date()): boolean {
  return compareLocalDateStrings(dateStr, todayLocalDateString(timezone, now)) > 0;
}

export function isLocalDateBefore(dateStr: string, minDateStr: string): boolean {
  return compareLocalDateStrings(dateStr, minDateStr) < 0;
}
