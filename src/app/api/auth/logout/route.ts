/**
 * POST /api/auth/logout
 *
 * Clears the session cookie, invalidating the current session.
 */

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth-server';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: 'Session invalidated.' });
}
