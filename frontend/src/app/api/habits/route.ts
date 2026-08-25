import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nudge/backend';
import { requireSession, isAuthError, serializeHabit } from '@/lib/habit-server-utils';
import { errorResponse } from '@/lib/api-utils';

export async function GET() {
  const session = await requireSession();
  if (isAuthError(session)) return session.error;

  const habits = await prisma.habit.findMany({
    where: { userId: session.userId },
    include: { checkIns: true },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = habits.map((h) => serializeHabit(h, session.timezone));
  return NextResponse.json(serialized);
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isAuthError(session)) return session.error;

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

  const habit = await prisma.habit.create({
    data: {
      userId: session.userId,
      name,
      description,
    },
    include: { checkIns: true },
  });

  return NextResponse.json(serializeHabit(habit, session.timezone), { status: 201 });
}
