import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
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
