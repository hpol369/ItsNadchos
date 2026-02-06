import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createSessionToken,
  getSessionCookieName,
  isAdminConfigured,
} from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  // Check if admin auth is configured
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Admin authentication not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSessionToken();

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
