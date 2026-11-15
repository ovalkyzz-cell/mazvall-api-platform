import { NextRequest, NextResponse } from 'next/server';
import { coreClient } from '@/lib/tempmail';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
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
