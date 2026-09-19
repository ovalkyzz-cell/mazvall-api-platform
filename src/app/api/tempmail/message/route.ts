import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/tempmail/message' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const email = req.nextUrl.searchParams.get('email');
    const link = req.nextUrl.searchParams.get('link');

    if (!email || !link) {
      return NextResponse.json({ success: false, error: 'Email dan link parameter wajib diisi', endpoint: '/tempmail/message' }, { status: 400 });
    }

    const result = await coreClient.readMessage(email, link);

    await logApiUsage(auth.keyId, auth.user.userId, '/tempmail/message', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Gagal read message', endpoint: '/tempmail/message' }, { status: 500 });
  }
}
