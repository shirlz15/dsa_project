/**
 * ─── Next.js 16 Proxy (Server-Side Route Protection) ─────────────────────────
 *
 * Runs server-side before any protected route is rendered or API handler executed.
 * Verifies the bn_admin_session HttpOnly cookie with HMAC-SHA256 signature verification.
 *
 * - Unauthenticated page requests are redirected to /login with return URL (?from=...)
 * - Unauthenticated API requests are returned 401 Unauthorized JSON
 * - Public routes (/ and /login) and public auth endpoints (/api/auth/*) bypass proxy
 *
 * SIMULATED DEMO AUTHENTICATION — NOT PRODUCTION-GRADE SECURITY
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionFromCookieValue } from '@/lib/auth-server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth endpoints through
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // 2. Extract and verify session cookie directly from the request
  const sessionCookie = request.cookies.get('bn_admin_session')?.value;
  const session = sessionCookie ? await verifySessionFromCookieValue(sessionCookie) : null;

  // 3. If authenticated, allow request to proceed
  if (session) {
    return NextResponse.next();
  }

  // 4. Unauthenticated API request -> 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Admin authentication required.',
        authenticated: false,
      },
      { status: 401 }
    );
  }

  // 5. Unauthenticated page request -> redirect to /login with return URL
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

// ─── Matcher: Protect every admin route and admin API endpoint ──────────────

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/blood-banks',
    '/blood-banks/:path*',
    '/inventory',
    '/inventory/:path*',
    '/expiry-monitoring',
    '/expiry-monitoring/:path*',
    '/requests',
    '/requests/:path*',
    '/redistribution',
    '/redistribution/:path*',
    '/drone-simulation',
    '/drone-simulation/:path*',
    '/transfers',
    '/transfers/:path*',
    '/alerts',
    '/alerts/:path*',
    '/audit',
    '/audit/:path*',
    '/reports',
    '/reports/:path*',
    '/settings',
    '/settings/:path*',
    '/dsa-lab',
    '/dsa-lab/:path*',
    '/performance-lab',
    '/performance-lab/:path*',
    '/architecture',
    '/architecture/:path*',
    '/about',
    '/about/:path*',
    '/api/admin/:path*',
    '/api/operations/:path*',
  ],
};
