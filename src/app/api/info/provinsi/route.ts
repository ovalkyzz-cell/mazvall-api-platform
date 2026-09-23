import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/info/provinsi' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const res = await fetch('https://kodepos-2d475.firebaseio.com/list_propinsi.json?print=pretty', {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error('Gagal mengambil data provinsi');

    const data = await res.json();

    const provinsi = Object.entries(data).map(([kode, nama]) => ({
      kode: kode.replace('p', ''),
      nama,
    }));

    await logApiUsage(auth.keyId, auth.user.userId, '/api/info/provinsi', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/info/provinsi',
      data: {
        total: provinsi.length,
        provinsi,
      },
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
