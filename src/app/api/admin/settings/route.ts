import { NextRequest, NextResponse } from 'next/server';
import { getRateLimits, updateRateLimitConfig, getSecuritySettings, updateSecuritySettings } from '@/lib/db';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const limits = await getRateLimits();
    const security = await getSecuritySettings();
    return successResponse({ limits, security });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const body = await req.json();

    if (body.limits && Array.isArray(body.limits)) {
      for (const l of body.limits) {
        if (l.tier && typeof l.rpm === 'number' && typeof l.rph === 'number' && typeof l.rpd === 'number') {
          await updateRateLimitConfig(l.tier, l.rpm, l.rph, l.rpd);
        }
      }
    }

    if (body.security && typeof body.security === 'object') {
      await updateSecuritySettings(body.security);
    }

    const updated = await getRateLimits();
    const security = await getSecuritySettings();
    return successResponse({ limits: updated, security }, 'Settings updated');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
