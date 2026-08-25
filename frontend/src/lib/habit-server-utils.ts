import { prisma, computeStreaks, getLocalDateString } from '@nudge/backend';
import { getSession, SessionPayload } from './auth';
import { errorResponse } from './api-utils';

export async function requireSession(): Promise<SessionPayload | { error: Response }> {
  const session = await getSession();
  if (!session) {
    return { error: errorResponse('Not authenticated', 401) };
  }
  return session;
}

export function isAuthError(x: unknown): x is { error: Response } {
  return typeof x === 'object' && x !== null && 'error' in x;
}

type HabitWithCheckIns = Awaited<ReturnType<typeof getHabitWithCheckIns>>;

export async function getHabitWithCheckIns(habitId: string, userId: string) {
  return prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { checkIns: true },
  });
}

/**
 * Converts a DB habit (with raw checkIns) into the API/frontend shape, computing
 * currentStreak/longestStreak fresh from the local-day check-in list every time.
 * We deliberately never store streaks in the DB — always derive them, so there's
 * no risk of stale/inconsistent numbers after a backfill.
 */
export function serializeHabit(habit: NonNullable<HabitWithCheckIns>, timezone: string) {
  const localDates = habit.checkIns.map((c) => c.localDate);
  const { currentStreak, longestStreak } = computeStreaks(localDates, timezone);

  return {
    id: habit.id,
    name: habit.name,
    description: habit.description ?? undefined,
    createdAt: getLocalDateString(habit.createdAt, timezone),
    currentStreak,
    longestStreak,
    checkIns: habit.checkIns
      .slice()
      .sort((a, b) => a.localDate.localeCompare(b.localDate))
      .map((c) => ({
        id: c.id,
        habitId: c.habitId,
        date: c.localDate,
        createdAt: c.utcInstant.toISOString(),
      })),
  };
}
