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
      return NextResponse.json({
        success: false,
        error: 'TrackingMore API key belum dikonfigurasi di server',
        endpoint: '/api/tools/tracking',
        note: 'Admin perlu mengatur environment variable TRACKINGMORE_API_KEY',
      }, { status: 503 });
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
