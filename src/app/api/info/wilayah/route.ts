import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

const BASE = 'https://nusantara.clowdlab.com/api/v1';
const EMSIFA = 'https://www.emsifa.com/api-wilayah-indonesia/api';

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const err: any = new Error(`Upstream error: ${res.status}`);
    err.upstreamStatus = res.status;
    throw err;
  }
  return res.json();
}

async function fetchEmsifa(path: string): Promise<any> {
  if (path === '/regions/provinces') {
    const data = await fetchJson(`${EMSIFA}/provinces.json`);
    return data.map((p: any) => ({ id: p.id, name: p.name, source: 'emsifa' }));
  }

  const singleProvince = path.match(/^\/regions\/provinces\/(\d+)$/);
  if (singleProvince) {
    const data = await fetchJson(`${EMSIFA}/provinces.json`);
    const found = data.find((p: any) => String(p.id) === singleProvince[1]);
    if (!found) {
      const err: any = new Error('Upstream error: 404');
      err.upstreamStatus = 404;
      throw err;
    }
    return { id: found.id, name: found.name, source: 'emsifa' };
  }

  const regencies = path.match(/^\/regions\/provinces\/(\d+)\/regencies$/);
  if (regencies) {
    const data = await fetchJson(`${EMSIFA}/regencies/${regencies[1]}.json`);
    return data.map((r: any) => ({ id: r.id, province_id: r.province_id, name: r.name, source: 'emsifa' }));
  }

  const districts = path.match(/^\/regions\/regencies\/(\d+)\/districts$/);
  if (districts) {
    const data = await fetchJson(`${EMSIFA}/districts/${districts[1]}.json`);
    return data.map((d: any) => ({ id: d.id, regency_id: d.regency_id, name: d.name, source: 'emsifa' }));
  }

  const err: any = new Error('FALLBACK_UNAVAILABLE');
  err.upstreamStatus = 0;
  throw err;
}

async function fetchNusantara(path: string): Promise<any> {
  try {
    return await fetchJson(`${BASE}${path}`, { 'accept': '*/*' });
  } catch (primaryError: any) {
    try {
      return await fetchEmsifa(path);
    } catch {
      throw primaryError;
    }
  }
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
    const upstream = error?.upstreamStatus || String(error?.message || '').includes('Upstream error');
    return NextResponse.json({
      success: false,
      error: upstream
        ? `Layanan data wilayah tidak tersedia (status ${error?.upstreamStatus || 'unknown'})`
        : (error?.message || 'Terjadi kesalahan server'),
      endpoint: '/api/info/wilayah',
    }, { status: upstream ? 502 : 500 });
  }
}
