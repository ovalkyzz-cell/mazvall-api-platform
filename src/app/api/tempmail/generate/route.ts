import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
    const username = req.nextUrl.searchParams.get('username');
    const domain = req.nextUrl.searchParams.get('domain');

    const email = await coreClient.generateEmail(username, domain);
    const [u, d] = email.split('@');

    await logApiUsage(auth.keyId, auth.user.userId, '/tempmail/generate', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      status: 'success',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: { email, username: u, domain: d, inbox_url: `https://generator.email/${email}` }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Gagal generate email', endpoint: '/tempmail/generate' }, { status: 500 });
  }
}
