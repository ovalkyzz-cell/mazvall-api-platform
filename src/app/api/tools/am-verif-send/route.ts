import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

const AM_VERIF_BASE = 'https://satriam.satriadeveloperz.workers.dev/api/satriam';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/tools/am-verif-send' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', endpoint: '/api/tools/am-verif-send' }, { status: 429 });
    }

    const params = new URLSearchParams();
    req.nextUrl.searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    const response = await fetch(`${AM_VERIF_BASE}/send-link?${params.toString()}`, {
      headers: { 'User-Agent': 'MazVall-API-Platform/1.0' },
      signal: AbortSignal.timeout(30000),
    });

    let body: any;
    try {
      body = await response.json();
    } catch {
      body = { success: false, error: 'Gagal memproses response' };
    }

    if (body && typeof body === 'object') {
      if ('author' in body) body.author = 'mazval';
      body.endpoint = '/api/tools/am-verif-send';
    }

    await logApiUsage(auth.keyId, auth.user.userId, '/tools/am-verif-send', 'GET', response.status, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server', endpoint: '/api/tools/am-verif-send' }, { status: 500 });
  }
}
