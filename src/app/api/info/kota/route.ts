import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/info/kota' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    const provinsiId = params.get('id') || params.get('provinsi');

    if (!provinsiId) {
      return NextResponse.json({
        success: false,
        error: 'Parameter id provinsi diperlukan. Contoh: ?id=31 atau ?provinsi=DKI Jakarta',
        endpoint: '/api/info/kota',
        example: '/api/info/kota?id=31',
      }, { status: 400 });
    }

    const kodeProvinsi = provinsiId.startsWith('p') ? provinsiId : `p${provinsiId}`;

    const res = await fetch(`https://kodepos-2d475.firebaseio.com/kota_kab/${kodeProvinsi}.json?print=pretty`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error('Gagal mengambil data kota/kabupaten');

    const data = await res.json();

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Provinsi tidak ditemukan',
        endpoint: '/api/info/kota',
      }, { status: 404 });
    }

    const kota = Object.entries(data).map(([kode, nama]) => ({
      kode: kode.replace('k', ''),
      nama,
    }));

    await logApiUsage(auth.keyId, auth.user.userId, '/api/info/kota', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/info/kota',
      data: {
        provinsi: kodeProvinsi,
        total: kota.length,
        kota_kabupaten: kota,
      },
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
