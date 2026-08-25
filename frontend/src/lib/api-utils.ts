import { NextResponse } from 'next/server';

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
