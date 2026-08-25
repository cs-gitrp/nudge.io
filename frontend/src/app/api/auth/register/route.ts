import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, isValidTimezone } from '@nudge/backend';
import { signSession, setSessionCookie } from '@/lib/auth';
import { errorResponse, isValidEmail } from '@/lib/api-utils';

const BCRYPT_ROUNDS = 10;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; timezone?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const timezone = body.timezone;

  if (!email || !password || !timezone) {
    return errorResponse('email, password, and timezone are all required', 400);
  }
  if (!isValidEmail(email)) {
    return errorResponse('Please enter a valid email address', 400);
  }
  if (password.length < 6) {
    return errorResponse('Password must be at least 6 characters', 400);
  }
  if (!isValidTimezone(timezone)) {
    return errorResponse(`"${timezone}" is not a recognized IANA timezone`, 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorResponse('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, timezone },
  });

  const token = signSession({ userId: user.id, email: user.email, timezone: user.timezone });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, timezone: user.timezone },
  });
}
