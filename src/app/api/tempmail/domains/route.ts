import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/tempmail/domains' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const domains = await coreClient.getActiveDomains(refresh);

    await logApiUsage(auth.keyId, auth.user.userId, '/tempmail/domains', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      status: 'success',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: { total_domains: domains.length, domains }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Gagal fetch domains', endpoint: '/tempmail/domains' }, { status: 500 });
  }
}
