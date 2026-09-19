import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/tempmail/inbox' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter wajib diisi', endpoint: '/tempmail/inbox' }, { status: 400 });
    }

    const result = await coreClient.checkInbox(email);

    await logApiUsage(auth.keyId, auth.user.userId, '/tempmail/inbox', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Gagal check inbox', endpoint: '/tempmail/inbox' }, { status: 500 });
  }
}
