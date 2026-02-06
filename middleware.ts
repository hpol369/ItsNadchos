import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // If no session cookie, redirect to login
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Full token verification happens in the API routes
    // Middleware just checks cookie presence for fast redirect
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
