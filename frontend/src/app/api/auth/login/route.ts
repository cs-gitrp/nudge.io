import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@nudge/backend';
import { signSession, setSessionCookie } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return errorResponse('email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same generic error whether the email doesn't exist or the password is wrong —
  // never reveal which one it was, to avoid leaking which emails are registered.
  const genericError = () => errorResponse('Invalid email or password', 401);

  if (!user) return genericError();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return genericError();

  const token = signSession({ userId: user.id, email: user.email, timezone: user.timezone });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, timezone: user.timezone },
  });
}
