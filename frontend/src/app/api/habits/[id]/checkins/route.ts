import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nudge/backend';
import {
  getLocalDateString,
  todayLocalDateString,
  isLocalDateInFuture,
  isLocalDateBefore,
} from '@nudge/backend';
import { requireSession, isAuthError, getHabitWithCheckIns, serializeHabit } from '@/lib/habit-server-utils';
import { errorResponse } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DATE_STRING_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  if (isAuthError(session)) return session.error;

  const { id: habitId } = await params;

  // Ownership check first — a user must never learn whether a habit ID exists
  // by probing the check-in endpoint.
  const habit = await getHabitWithCheckIns(habitId, session.userId);
  if (!habit) return errorResponse('Habit not found', 404);

  let body: { date?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const now = new Date();
  const todayStr = todayLocalDateString(session.timezone, now);

  // No `date` in body => check in for today. Otherwise this is a backfill request.
  let targetLocalDate: string;
  let utcInstant: Date;

  if (body.date) {
    if (!DATE_STRING_RE.test(body.date)) {
      return errorResponse('date must be in YYYY-MM-DD format', 400);
    }
    targetLocalDate = body.date;

    if (isLocalDateInFuture(targetLocalDate, session.timezone, now)) {
      return errorResponse('Cannot log a check-in for a future date', 400);
    }

    const habitCreatedLocalDate = getLocalDateString(habit.createdAt, session.timezone);
    if (isLocalDateBefore(targetLocalDate, habitCreatedLocalDate)) {
      return errorResponse(
        `Cannot check in before this habit was created (${habitCreatedLocalDate})`,
        400
      );
    }

    // For a backfilled day, we don't have a "real" instant the action happened at.
    // Anchor it at local noon on that day so it unambiguously falls within that
    // local day regardless of the timezone's UTC offset, then store the UTC
    // equivalent. This is a display/audit timestamp only — localDate (already
    // resolved above) is the field all streak logic and uniqueness checks use.
    utcInstant = localNoonToUtc(targetLocalDate, session.timezone);
  } else {
    targetLocalDate = todayStr;
    utcInstant = now;
  }

  // Duplicate check — the DB unique constraint on (habitId, localDate) is the final
  // backstop, but we check here first to return a clean, specific error message.
  const alreadyChecked = habit.checkIns.some((c) => c.localDate === targetLocalDate);
  if (alreadyChecked) {
    return errorResponse(`This habit already has a check-in for ${targetLocalDate}`, 409);
  }

  try {
    await prisma.checkIn.create({
      data: {
        habitId,
        utcInstant,
        localDate: targetLocalDate,
      },
    });
  } catch (err: unknown) {
    // Race-condition backstop: two simultaneous requests both pass the check above,
    // but the DB's unique constraint on (habitId, localDate) rejects the second insert.
    if (isUniqueConstraintError(err)) {
      return errorResponse(`This habit already has a check-in for ${targetLocalDate}`, 409);
    }
    throw err;
  }

  const updated = await getHabitWithCheckIns(habitId, session.userId);
  return NextResponse.json(serializeHabit(updated!, session.timezone), { status: 201 });
}

/** Converts a "YYYY-MM-DD" local date + timezone into the UTC instant of 12:00 local time on that day. */
function localNoonToUtc(localDateStr: string, timezone: string): Date {
  // Start from a naive UTC guess of local noon, then correct for the timezone's offset
  // at that instant (handles DST correctly for the vast majority of real-world cases).
  const [y, m, d] = localDateStr.split('-').map(Number);
  const naiveUtcGuess = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const resolvedLocalDate = getLocalDateString(naiveUtcGuess, timezone);
  if (resolvedLocalDate === localDateStr) {
    return naiveUtcGuess;
  }

  // Offset pushed us to the wrong day (large-offset timezones) — nudge by the
  // day difference and re-anchor at UTC noon of the corrected day. Good enough
  // since we only need "some instant within that local day", not an exact clock time.
  const diffDays = resolvedLocalDate > localDateStr ? -1 : 1;
  return new Date(Date.UTC(y, m - 1, d + diffDays, 12, 0, 0));
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}
