import { describe, it, expect } from 'vitest';
import { getLocalDateString, addDaysToLocalDateString, isLocalDateInFuture, isValidTimezone } from './local-day';
import { computeStreaks } from './streak';

const KOLKATA = 'Asia/Kolkata'; // UTC+05:30, no DST — good baseline
const NEW_YORK = 'America/New_York'; // has DST — used for edge case tests

describe('local-day.ts', () => {
  it('converts a UTC instant to the correct local day in Asia/Kolkata', () => {
    // 2026-03-10T14:30Z -> 2026-03-10 20:00 IST -> still March 10 locally
    expect(getLocalDateString(new Date('2026-03-10T14:30:00Z'), KOLKATA)).toBe('2026-03-10');
  });

  it('rolls over to the next local day near midnight UTC when timezone is ahead', () => {
    // 2026-03-11T21:30Z -> +05:30 -> 2026-03-12T03:00 local -> next day
    expect(getLocalDateString(new Date('2026-03-11T21:30:00Z'), KOLKATA)).toBe('2026-03-12');
  });

  it('addDaysToLocalDateString adds/subtracts whole days correctly across month boundaries', () => {
    expect(addDaysToLocalDateString('2026-02-28', 1)).toBe('2026-03-01'); // 2026 not a leap year
    expect(addDaysToLocalDateString('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('correctly identifies a future local date relative to "now"', () => {
    const now = new Date('2026-03-10T12:00:00Z'); // 2026-03-10 in Kolkata
    expect(isLocalDateInFuture('2026-03-11', KOLKATA, now)).toBe(true);
    expect(isLocalDateInFuture('2026-03-10', KOLKATA, now)).toBe(false);
    expect(isLocalDateInFuture('2026-03-09', KOLKATA, now)).toBe(false);
  });

  it('rejects an invalid IANA timezone string', () => {
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('Not/AZone')).toBe(false);
  });

  it('handles a DST spring-forward day in America/New_York correctly (offset changes from -5 to -4)', () => {
    // DST starts 2026-03-08 at 2:00am local (07:00 UTC), switching EST (-5) -> EDT (-4).
    // Just before the switch: 2026-03-08T06:59Z -> 01:59 EST -> still March 8.
    expect(getLocalDateString(new Date('2026-03-08T06:59:00Z'), NEW_YORK)).toBe('2026-03-08');
    // Just after the switch: 2026-03-08T07:01Z -> 03:01 EDT -> still March 8, offset now -4.
    expect(getLocalDateString(new Date('2026-03-08T07:01:00Z'), NEW_YORK)).toBe('2026-03-08');
    // A later instant that would be March 8 under the old -5 offset but is March 9 under -4:
    expect(getLocalDateString(new Date('2026-03-09T04:30:00Z'), NEW_YORK)).toBe('2026-03-09');
  });
});

describe('computeStreaks — assignment worked example (Asia/Kolkata)', () => {
  it('matches the exact worked example from the spec', () => {
    // A: 2026-03-10T14:30Z -> local 2026-03-10
    // B: 2026-03-11T10:30Z -> local 2026-03-11 (streak = 2)
    // C: 2026-03-11T21:30Z -> local 2026-03-12 (streak = 3)
    // D: 2026-03-12T17:30Z -> local 2026-03-12 (SAME day as C -> duplicate, not passed twice here
    //    since dedup/duplicate-rejection happens at write time; computeStreaks just proves
    //    that a duplicate local day does not double-count if it ever reached this function)
    const dates = [
      getLocalDateString(new Date('2026-03-10T14:30:00Z'), KOLKATA),
      getLocalDateString(new Date('2026-03-11T10:30:00Z'), KOLKATA),
      getLocalDateString(new Date('2026-03-11T21:30:00Z'), KOLKATA),
      getLocalDateString(new Date('2026-03-12T17:30:00Z'), KOLKATA), // duplicate of C's local day
    ];

    const now = new Date('2026-03-12T18:00:00Z'); // still 2026-03-12 local (23:30 IST)
    const result = computeStreaks(dates, KOLKATA, now);

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });
});

describe('computeStreaks — general behavior', () => {
  it('returns zero streaks for no check-ins', () => {
    expect(computeStreaks([], KOLKATA)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('currentStreak is broken if the most recent check-in is older than yesterday', () => {
    const now = new Date('2026-03-15T12:00:00Z'); // "today" = 2026-03-15 in Kolkata
    const dates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    const result = computeStreaks(dates, KOLKATA, now);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  it('currentStreak stays alive if the last check-in was yesterday (today not yet logged)', () => {
    const now = new Date('2026-03-15T06:00:00Z'); // "today" = 2026-03-15 in Kolkata (11:30 IST)
    const dates = ['2026-03-13', '2026-03-14'];
    const result = computeStreaks(dates, KOLKATA, now);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('longestStreak can exceed currentStreak when the active streak is shorter than a past one', () => {
    const now = new Date('2026-03-20T06:00:00Z'); // "today" = 2026-03-20 Kolkata
    const dates = [
      '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', // longest run = 5
      '2026-03-19', '2026-03-20', // current run = 2
    ];
    const result = computeStreaks(dates, KOLKATA, now);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });

  it('is unaffected by out-of-order input (unsorted check-in list)', () => {
    const now = new Date('2026-03-12T18:00:00Z');
    const dates = ['2026-03-12', '2026-03-10', '2026-03-11'];
    const result = computeStreaks(dates, KOLKATA, now);
    expect(result.currentStreak).toBe(3);
  });
});
