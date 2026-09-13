import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';
import { hasAccess } from '@/lib/featureAccess';
import { prisma } from '@/lib/prisma';

const AM_VERIF_BASE = 'https://satriam.satriadeveloperz.workers.dev/api/satriam';
const SERVICE_PATH = '/tools/am-verif-send';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/tools/am-verif-send' }, { status: 401 });
    }

    if (auth.user.role !== 'admin') {
      let featureAccess = 'all';
      if (auth.user.planId) {
        const plan = await prisma.plan.findUnique({ where: { id: auth.user.planId }, select: { featureAccess: true } });
        if (plan) featureAccess = plan.featureAccess;
      } else {
        featureAccess = 'ai,tempmail';
      }
      if (!hasAccess(featureAccess, SERVICE_PATH)) {
        return NextResponse.json({ success: false, error: 'Paket kamu tidak memiliki akses ke endpoint ini.', endpoint: '/api/tools/am-verif-send' }, { status: 403 });
      }
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', endpoint: '/api/tools/am-verif-send' }, { status: 429 });
    }

    const email = req.nextUrl.searchParams.get('email');
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Parameter email tidak valid', endpoint: '/api/tools/am-verif-send' }, { status: 400 });
    }

    const response = await fetch(`${AM_VERIF_BASE}/send-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'MazVall-API-Platform/1.0' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(30000),
    });

    const body = await response.json();

    if (body && typeof body === 'object') {
      body.author = 'mazval';
      body.endpoint = '/api/tools/am-verif-send';
    }

    await logApiUsage(auth.keyId, auth.user.userId, SERVICE_PATH, 'POST', response.status, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server', endpoint: '/api/tools/am-verif-send' }, { status: 500 });
  }
}
