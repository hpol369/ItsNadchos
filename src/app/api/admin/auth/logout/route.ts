import { NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/admin-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the session cookie
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}
