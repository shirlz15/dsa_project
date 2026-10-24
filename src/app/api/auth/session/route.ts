/**
 * GET /api/auth/session
 *
 * Returns the current session user from the verified HttpOnly cookie.
 * Used by client components to sync Zustand state with the server session.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      facility: session.facility,
      badgeNumber: session.badgeNumber,
      isDemo: session.isDemo,
      sessionToken: `SES-${session.isDemo ? 'DEMO' : 'AUTH'}-${session.iat}`,
      authenticatedAt: new Date(session.iat * 1000).toISOString(),
    },
  });
}
