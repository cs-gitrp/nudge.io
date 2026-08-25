import { addDaysToLocalDateString, todayLocalDateString } from './local-day';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Computes current + longest streak from a set of local-day strings ("YYYY-MM-DD").
 * Pure function: no DB, no HTTP, no Date-object timezone ambiguity — every date here
 * is already a resolved local day (see local-day.ts for how those get produced).
 *
 * - longestStreak: the longest run of consecutive local days anywhere in history.
 * - currentStreak: the run of consecutive local days ending at "today" or "yesterday"
 *   (in the user's timezone). If the most recent check-in is older than yesterday,
 *   the streak is considered broken -> currentStreak = 0.
 */
export function computeStreaks(
  localDates: string[],
  timezone: string,
  now: Date = new Date()
): StreakResult {
  if (localDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // De-dupe (should already be unique thanks to the DB constraint, but this function
  // must be safe to call standalone) and sort ascending.
  const uniqueSorted = Array.from(new Set(localDates)).sort();

  // --- Longest streak: scan for the longest run of consecutive days ---
  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const expectedNext = addDaysToLocalDateString(uniqueSorted[i - 1], 1);
    if (uniqueSorted[i] === expectedNext) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  // --- Current streak: must end today or yesterday, else it's broken ---
  const today = todayLocalDateString(timezone, now);
  const yesterday = addDaysToLocalDateString(today, -1);

  const mostRecent = uniqueSorted[uniqueSorted.length - 1];
  let currentStreak = 0;

  if (mostRecent === today || mostRecent === yesterday) {
    // Walk backward from the most recent check-in counting consecutive days.
    currentStreak = 1;
    let cursor = mostRecent;
    for (let i = uniqueSorted.length - 2; i >= 0; i--) {
      const expectedPrev = addDaysToLocalDateString(cursor, -1);
      if (uniqueSorted[i] === expectedPrev) {
        currentStreak++;
        cursor = uniqueSorted[i];
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
  };
}
