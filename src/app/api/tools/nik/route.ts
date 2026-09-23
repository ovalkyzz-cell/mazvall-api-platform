import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/tools/nik' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const body = await req.json();
    const { nik, reference_year, century_override } = body;

    if (!nik) {
      return NextResponse.json({
        success: false,
        error: 'Parameter nik diperlukan di body request',
        endpoint: '/api/tools/nik',
        example: { nik: '1101010101010001', reference_year: 2026, century_override: 2000 },
      }, { status: 400 });
    }

    const payload: any = { nik };
    if (reference_year) payload.reference_year = reference_year;
    if (century_override) payload.century_override = century_override;

    const res = await fetch('https://nusantara.clowdlab.com/api/v1/nik/parse', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`NIK Parse error: ${res.status}`);

    const data = await res.json();

    await logApiUsage(auth.keyId, auth.user.userId, '/api/tools/nik', 'POST', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/tools/nik',
      data,
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
