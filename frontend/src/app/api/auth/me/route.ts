import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse('Not authenticated', 401);

  return NextResponse.json({
    user: { id: session.userId, email: session.email, timezone: session.timezone },
  });
}
