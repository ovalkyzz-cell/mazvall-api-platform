import { NextRequest, NextResponse } from 'next/server';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
    const params = new URLSearchParams(req.nextUrl.searchParams);
    const code = params.get('code') || params.get('kode');

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Parameter code/kode diperlukan. Contoh: ?code=40123',
        endpoint: '/api/info/postal',
      }, { status: 400 });
    }

    let res: Response;
    try {
      res = await fetch(`https://nusantara.clowdlab.com/api/v1/postal-codes/${code}`, {
        headers: { 'accept': '*/*' },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: `Layanan data kode pos gagal dihubungi: ${error?.message || 'timeout'}`,
        endpoint: '/api/info/postal',
      }, { status: 502 });
    }

    if (res.status === 404) {
      return NextResponse.json({ success: false, error: `Kode pos ${code} tidak ditemukan` }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Layanan data kode pos tidak tersedia (status ${res.status})`,
        endpoint: '/api/info/postal',
      }, { status: 502 });
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Layanan data kode pos mengembalikan respons tidak valid',
        endpoint: '/api/info/postal',
      }, { status: 502 });
    }

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
