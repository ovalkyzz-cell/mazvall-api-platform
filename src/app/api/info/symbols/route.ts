import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/info/symbols' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    const provinceId = params.get('id') || params.get('province');

    const baseUrl = 'https://symbolsofindonesia.vercel.app';
    const url = provinceId ? `${baseUrl}/provinces/${provinceId}` : `${baseUrl}/provinces/list`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Layanan simbol provinsi tidak tersedia (status ${res.status})`,
        endpoint: '/api/info/symbols',
      }, { status: 502 });
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Layanan simbol provinsi mengembalikan respons tidak valid',
        endpoint: '/api/info/symbols',
      }, { status: 502 });
    }

    await logApiUsage(auth.keyId, auth.user.userId, '/api/info/symbols', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/info/symbols',
      data: provinceId ? data : { total: data.length || Object.keys(data).length, provinces: data },
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Layanan simbol provinsi gagal dihubungi: ${error?.message || 'timeout'}`,
      endpoint: '/api/info/symbols',
    }, { status: 502 });
  }
}
