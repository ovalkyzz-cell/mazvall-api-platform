import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/info/postal' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    const code = params.get('code') || params.get('kode');

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Parameter code/kode diperlukan. Contoh: ?code=40123',
        endpoint: '/api/info/postal',
      }, { status: 400 });
    }

    const res = await fetch(`https://nusantara.clowdlab.com/api/v1/postal-codes/${code}`, {
      headers: { 'accept': '*/*' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Kode pos ${code} tidak ditemukan` }, { status: 404 });
    }

    const data = await res.json();

    await logApiUsage(auth.keyId, auth.user.userId, '/api/info/postal', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/info/postal',
      data,
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
