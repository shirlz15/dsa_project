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
  id: 'ADMIN-NA-7701',
  userId: 'ADMIN-NA-7701',
  name: 'Dr. Ramesh Kumar',
  email: 'admin@bloodnavigator.org',
  role: 'Network Director' as const,
  facility: 'State Emergency Hematology Logistics Command',
  badgeNumber: 'BN-DIR-0881',
  isDemo: true,
};

// Recognized demo administrator emails and passwords
const VALID_DEMO_EMAILS = new Set([
  'admin@bloodnavigator.org',
  'ramesh.kumar@bloodnavigator.org',
]);

const VALID_DEMO_PASSWORDS = new Set([
  'password',
  'admin123',
]);

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

    const normalizedEmail = String(email).trim().toLowerCase();
    const isValidEmail = VALID_DEMO_EMAILS.has(normalizedEmail);
    const isValidPassword = VALID_DEMO_PASSWORDS.has(String(password).trim());

    if (!isValidEmail || !isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password. Please use the valid demo credentials provided on the login screen.',
        },
        { status: 401 },
      );
    }

    const sessionUser = {
      id: 'ADMIN-NA-7701',
      userId: 'ADMIN-NA-7701',
      name: 'Dr. Ramesh Kumar',
      email: normalizedEmail,
      role: 'Network Director' as const,
      facility: 'State Emergency Hematology Logistics Command',
      badgeNumber: 'BN-DIR-0881',
      isDemo: true,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      notice: 'Simulated authentication successful. In production, verify credentials against a secure identity provider.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }
}
