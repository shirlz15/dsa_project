/**
 * ─── Server-Side Session Management ─────────────────────────────────────────
 *
 * SIMULATED DEMO AUTHENTICATION — NOT PRODUCTION-GRADE SECURITY
 *
 * This module provides HttpOnly cookie-based session management using
 * HMAC-SHA256 signed tokens via the Web Crypto API. It is designed for
 * the Blood Navigator academic demo and does NOT constitute a real
 * authentication system suitable for clinical or production use.
 *
 * In a production deployment, replace this with a proper identity provider
 * (e.g. NextAuth.js / Auth.js, Clerk, Auth0, or institutional SSO).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { cookies } from 'next/headers';

// ─── Constants ───────────────────────────────────────────────────────────────

const COOKIE_NAME = 'bn_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours in seconds

/**
 * The signing secret. In production this MUST come from an environment
 * variable (e.g. process.env.SESSION_SECRET). The fallback is a demo-only
 * value that is NOT secure for real deployments.
 */
function getSecret(): string {
  return process.env.SESSION_SECRET || 'bn-demo-session-secret-not-for-production';
}

// ─── Crypto Helpers (Web Crypto API — runs in Node.js & Edge) ────────────────

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verify(payload: string, signature: string): Promise<boolean> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sigBuf = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(payload));
}

// ─── Session Payload ─────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  facility: string;
  badgeNumber: string;
  isDemo: boolean;
  iat: number; // issued at (epoch seconds)
  exp: number; // expires at (epoch seconds)
}

// ─── Token Creation & Verification ──────────────────────────────────────────

export async function createSessionToken(data: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...data,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const sig = await sign(b64);
  return `${b64}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;

  try {
    const valid = await verify(b64, sig);
    if (!valid) return null;

    const json = decodeURIComponent(escape(atob(b64)));
    const payload: SessionPayload = JSON.parse(json);

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie Management ──────────────────────────────────────────────────────

/**
 * Set the session cookie. Call from API route handlers.
 */
export async function setSessionCookie(data: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await createSessionToken(data);
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
  } catch {
    // In standalone unit test runners without a request scope, safely ignore
  }
  return token;
}

/**
 * Read and verify the session cookie. Returns the payload or null.
 */
export async function getSession(request?: Request): Promise<SessionPayload | null> {
  // If a Request object is provided, read the cookie from request headers directly
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)bn_admin_session=([^;]+)/);
    if (match && match[1]) {
      return verifySessionToken(match[1]);
    }
    return null;
  }

  // Otherwise, use next/headers cookies() with try/catch fallback
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;
    return verifySessionToken(cookie.value);
  } catch {
    return null;
  }
}

/**
 * Require a verified session. Throws an Error if no valid session exists.
 * Useful for protected Server Actions and API route handlers.
 */
export async function requireAdminSession(request?: Request): Promise<SessionPayload> {
  const session = await getSession(request);
  if (!session) {
    throw new Error('Unauthorized: Valid admin session required.');
  }
  return session;
}

/**
 * Clear (invalidate) the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expire
    });
  } catch {
    // In standalone unit test runners without a request scope, safely ignore
  }
}

// ─── Proxy-compatible token verification (no cookies() dependency) ──────────

/**
 * Verify a raw cookie value without using next/headers cookies().
 * Suitable for use inside proxy.ts where cookies() may not be available.
 */
export async function verifySessionFromCookieValue(cookieValue: string): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  return verifySessionToken(cookieValue);
}
