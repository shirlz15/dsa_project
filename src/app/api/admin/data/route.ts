/**
 * GET /api/admin/data
 *
 * Protected administrative data endpoint.
 * Requires a verified server-side session cookie.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET(request?: Request) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Admin authentication required to access operational data.',
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    dataAccessGranted: true,
    operator: {
      userId: session.userId,
      name: session.name,
      role: session.role,
      facility: session.facility,
    },
    systemStatus: 'OPERATIONAL',
    corridorState: 'MONITORED',
    timestamp: new Date().toISOString(),
  });
}
