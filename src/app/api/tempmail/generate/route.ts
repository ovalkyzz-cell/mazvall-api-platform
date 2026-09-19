import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/tempmail/generate' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

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
