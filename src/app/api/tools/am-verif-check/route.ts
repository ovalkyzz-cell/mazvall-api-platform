import { NextRequest, NextResponse } from 'next/server';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

const AM_VERIF_BASE = 'https://satriam.satriadeveloperz.workers.dev/api/satriam';
const SERVICE_PATH = '/tools/am-verif-check';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
    const email = req.nextUrl.searchParams.get('email');
    const token = req.nextUrl.searchParams.get('token');
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Parameter email tidak valid', endpoint: '/api/tools/am-verif-check' }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ success: false, error: 'Parameter token tidak boleh kosong', endpoint: '/api/tools/am-verif-check' }, { status: 400 });
    }

    const response = await fetch(`${AM_VERIF_BASE}/verify-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'MazVall-API-Platform/1.0' },
      body: JSON.stringify({ email, magicLink: token }),
      signal: AbortSignal.timeout(30000),
    });

    const body = await response.json();

    if (body && typeof body === 'object') {
      body.author = 'mazval';
      body.endpoint = '/api/tools/am-verif-check';
    }

    await logApiUsage(auth.keyId, auth.user.userId, SERVICE_PATH, 'POST', response.status, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server', endpoint: '/api/tools/am-verif-check' }, { status: 500 });
  }
}
