import { NextRequest, NextResponse } from 'next/server';
import { getAllKeys, createApiKey } from '@/lib/db';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const keys = await getAllKeys();
    return successResponse({ keys });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const { userId, name, rateLimit } = await req.json();

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: 'userId and name required' }, { status: 400 });
    }

    const apiKey = await createApiKey(userId, name, rateLimit || 100);
    return successResponse({ apiKey }, 'API key generated');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
