import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nudge/backend';
import { requireSession, isAuthError, getHabitWithCheckIns, serializeHabit } from '@/lib/habit-server-utils';
import { errorResponse } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  if (isAuthError(session)) return session.error;

  const { id } = await params;
  const habit = await getHabitWithCheckIns(id, session.userId);
  // Return the same 404 whether the habit doesn't exist or belongs to another user —
  // don't leak whether an ID exists at all.
  if (!habit) return errorResponse('Habit not found', 404);

  return NextResponse.json(serializeHabit(habit, session.timezone));
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  if (isAuthError(session)) return session.error;

  const { id } = await params;
  const existing = await prisma.habit.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return errorResponse('Habit not found', 404);

  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const name = body.name?.trim();
  const description = body.description?.trim() || null;

  if (!name) {
    return errorResponse('Habit name is required', 400);
  }
  if (name.length > 100) {
    return errorResponse('Habit name must be 100 characters or fewer', 400);
  }
  if (description && description.length > 500) {
    return errorResponse('Description must be 500 characters or fewer', 400);
  }

  const habit = await prisma.habit.update({
    where: { id },
    data: { name, description },
    include: { checkIns: true },
  });

  return NextResponse.json(serializeHabit(habit, session.timezone));
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  if (isAuthError(session)) return session.error;

  const { id } = await params;
  const existing = await prisma.habit.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return errorResponse('Habit not found', 404);

  await prisma.habit.delete({ where: { id } }); // cascades to check_ins via schema relation

  return NextResponse.json({ ok: true });
}
