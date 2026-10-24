/**
 * POST /api/auth/login
 *
 * SIMULATED DEMO AUTHENTICATION — NOT PRODUCTION-GRADE SECURITY
 *
 * Accepts JSON body:
 *   { email: string, password: string }   – credential login (simulated)
 *   { demo: true }                        – explicit demo admin session
 *
 * On success, sets an HttpOnly session cookie and returns the user payload.
 */

import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth-server';

// ─── Demo admin profile ─────────────────────────────────────────────────────

const DEMO_ADMIN = {
  userId: 'ADMIN-NA-7701',
  name: 'Dr. Ramesh Kumar',
  email: 'ramesh.kumar@bloodnavigator.org',
  role: 'Network Director',
  facility: 'State Emergency Hematology Logistics Command',
  badgeNumber: 'BN-DIR-0881',
  isDemo: true,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── Explicit demo session ──────────────────────────────────────────────
    if (body.demo === true) {
      await setSessionCookie(DEMO_ADMIN);
      return NextResponse.json({
        success: true,
        user: DEMO_ADMIN,
        notice: 'Simulated demo admin session created. This is NOT production authentication.',
      });
    }

    // ── Credential-based login (simulated) ────────────────────────────────
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    // In a real system, validate against a user database or identity provider.
    // This demo accepts any non-empty credentials as the admin user.
    // The credential values are NOT hardcoded secrets—any input is accepted.
    const sessionUser = {
      userId: 'ADMIN-NA-7701',
      name: 'Dr. Ramesh Kumar',
      email: email,
      role: 'Network Director' as const,
      facility: 'State Emergency Hematology Logistics Command',
      badgeNumber: 'BN-DIR-0881',
      isDemo: true, // Always demo in this academic project
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      notice: 'Simulated authentication. In production, verify credentials against a secure identity provider.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }
}
