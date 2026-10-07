import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

const TRACKINGMORE_API_KEY = process.env.TRACKINGMORE_API_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/tools/tracking' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    const trackingNumber = params.get('tracking') || params.get('resi');
    const courier = params.get('courier') || params.get('kurir') || 'jne';

    if (!trackingNumber) {
      return NextResponse.json({
        success: false,
        error: 'Parameter tracking/resi diperlukan',
        endpoint: '/api/tools/tracking',
        example: '/api/tools/tracking?tracking=JNE123456789&courier=jne',
        supported_couriers: ['jne', 'jnt', 'sicepat', 'pos', 'tiki', 'anteraja', 'lion', 'wahana', 'ninja'],
      }, { status: 400 });
    }

    if (!TRACKINGMORE_API_KEY) {
      // Cadangan: API cek resi gratis tanpa key (deteksi kurir otomatis).
      // Data placeholder (tanpa tanggal perjalanan) dianggap tidak ditemukan
      // agar tidak menampilkan status yang dikarang sumber.
      const sumber = 'cek-resi.romi.my.id';
      try {
        const fb = await fetch(`https://cek-resi.romi.my.id/cek-resi/${encodeURIComponent(trackingNumber)}`, {
          headers: { Accept: 'application/json', 'User-Agent': 'MazVal-API/1.0' },
          signal: AbortSignal.timeout(20000),
        });
        const body: any = await fb.json().catch(() => null);
        const info = body?.data?.data;
        const perjalanan: any[] = Array.isArray(info?.perjalanan) ? info.perjalanan : [];
        const adaPerjalanan = perjalanan.some((p) => p && p.tanggal && String(p.tanggal).trim() && String(p.tanggal).trim() !== '-');

        if (!fb.ok || !info || !adaPerjalanan) {
          return NextResponse.json({
            success: false,
            error: 'Nomor resi tidak ditemukan atau belum ada perjalanan. Pastikan nomor & kurir benar.',
            endpoint: '/api/tools/tracking',
            tracking_number: trackingNumber,
            courier,
            sumber,
          }, { status: 404 });
        }

        await logApiUsage(auth.keyId, auth.user.userId, '/api/tools/tracking', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

        return NextResponse.json({
          success: true,
          creator: 'mazval',
          endpoint: '/api/tools/tracking',
          sumber,
          data: {
            tracking_number: trackingNumber,
            courier,
            status: info.status || 'unknown',
            tracking: {
              expedisi: info.expedisi,
              pengirim: info.pengirim,
              penerima: info.penerima,
              tujuan: info.tujuan,
              tanggal_kirim: info.tanggalKirim,
              perjalanan,
            },
          },
        }, {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Layanan lacak paket sedang tidak tersedia. Coba lagi beberapa saat lagi.',
          endpoint: '/api/tools/tracking',
        }, { status: 503 });
      }
    }

    const trackingRes = await fetch('https://api.trackingmore.com/v4/trackings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRACKINGMORE_API_KEY}`,
      },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        courier_code: courier,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const trackingData = await trackingRes.json();

    if (!trackingRes.ok) {
      const checkRes = await fetch(`https://api.trackingmore.com/v4/trackings/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${TRACKINGMORE_API_KEY}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      const checkData = await checkRes.json();

      if (checkRes.ok && checkData.data) {
        await logApiUsage(auth.keyId, auth.user.userId, '/api/tools/tracking', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

        return NextResponse.json({
          success: true,
          creator: 'mazval',
          endpoint: '/api/tools/tracking',
          data: {
            tracking_number: trackingNumber,
            courier: courier,
            status: checkData.data.status || 'unknown',
            tracking: checkData.data,
          },
        }, {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Gagal melacak paket. Pastikan nomor resi dan kurir benar.',
        endpoint: '/api/tools/tracking',
        tracking_number: trackingNumber,
        courier,
      }, { status: 404 });
    }

    await logApiUsage(auth.keyId, auth.user.userId, '/api/tools/tracking', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/tools/tracking',
      data: {
        tracking_number: trackingNumber,
        courier: courier,
        status: trackingData.data?.status || 'processing',
        tracking: trackingData.data,
      },
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
