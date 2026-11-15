import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
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
