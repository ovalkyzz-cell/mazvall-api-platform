import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

const BASE = 'https://nusantara.clowdlab.com/api/v1';

async function fetchNusantara(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'accept': '*/*' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Nusantara API error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/info/wilayah' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    const type = params.get('type') || 'provinces';
    const id = params.get('id');
    const sub = params.get('sub');
    const geojson = params.get('geojson') === 'true';
    const adjacent = params.get('adjacent');
    const level = params.get('level');

    let data: any;

    if (type === 'provinces') {
      if (id) {
        if (geojson) {
          data = await fetchNusantara(`/regions/provinces/${id}/geojson`);
        } else if (sub === 'regencies') {
          data = await fetchNusantara(`/regions/provinces/${id}/regencies`);
        } else {
          data = await fetchNusantara(`/regions/provinces/${id}`);
        }
      } else {
        data = await fetchNusantara('/regions/provinces');
      }
    } else if (type === 'regencies') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Parameter id diperlukan untuk regencies', endpoint: '/api/info/wilayah' }, { status: 400 });
      }
      if (geojson) {
        data = await fetchNusantara(`/regions/regencies/${id}/geojson`);
      } else if (sub === 'districts') {
        data = await fetchNusantara(`/regions/regencies/${id}/districts`);
      } else if (adjacent) {
        data = await fetchNusantara(`/regions/regencies/${id}/adjacent?level=${level || 'regencies'}`);
      } else {
        data = await fetchNusantara(`/regions/regencies/${id}`);
      }
    } else if (type === 'districts') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Parameter id diperlukan untuk districts', endpoint: '/api/info/wilayah' }, { status: 400 });
      }
      if (geojson) {
        data = await fetchNusantara(`/regions/districts/${id}/geojson`);
      } else if (sub === 'villages') {
        data = await fetchNusantara(`/regions/districts/${id}/villages`);
      } else if (adjacent) {
        data = await fetchNusantara(`/regions/districts/${id}/adjacent?level=${level || 'districts'}`);
      } else {
        data = await fetchNusantara(`/regions/districts/${id}`);
      }
    } else if (type === 'villages') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Parameter id diperlukan untuk villages', endpoint: '/api/info/wilayah' }, { status: 400 });
      }
      if (geojson) {
        data = await fetchNusantara(`/regions/villages/${id}/geojson`);
      } else if (adjacent) {
        data = await fetchNusantara(`/regions/villages/${id}/adjacent?level=${level || 'villages'}`);
      } else {
        data = await fetchNusantara(`/regions/villages/${id}`);
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Type tidak valid. Gunakan: provinces, regencies, districts, atau villages',
        endpoint: '/api/info/wilayah',
        example: '/api/info/wilayah?type=provinces',
      }, { status: 400 });
    }

    await logApiUsage(auth.keyId, auth.user.userId, '/api/info/wilayah', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/info/wilayah',
      type,
      data,
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
