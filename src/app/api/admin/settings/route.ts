import { NextRequest, NextResponse } from 'next/server';
import { getRateLimits, updateRateLimitConfig } from '@/lib/db';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const limits = await getRateLimits();
    return successResponse({ limits });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const { limits } = await req.json();

    if (!limits || !Array.isArray(limits)) {
      return NextResponse.json({ success: false, error: 'limits array required' }, { status: 400 });
    }

    for (const l of limits) {
      if (l.tier && typeof l.rpm === 'number' && typeof l.rph === 'number' && typeof l.rpd === 'number') {
        await updateRateLimitConfig(l.tier, l.rpm, l.rph, l.rpd);
      }
    }

    const updated = await getRateLimits();
    return successResponse({ limits: updated }, 'Rate limits updated');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
