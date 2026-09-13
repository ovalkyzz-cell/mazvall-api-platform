import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';
import { hasAccess } from '@/lib/featureAccess';
import { prisma } from '@/lib/prisma';

const NFTOKEN_BASE = 'https://nftoken.zone.id/api/auto-generate';
const SERVICE_PATH = '/tools/nftoken-generate';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/tools/nftoken-generate' }, { status: 401 });
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
        return NextResponse.json({ success: false, error: 'Paket kamu tidak memiliki akses ke endpoint ini. Upgrade ke paket berbayar.', endpoint: '/api/tools/nftoken-generate' }, { status: 403 });
      }
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', endpoint: '/api/tools/nftoken-generate' }, { status: 429 });
    }

    const countParam = req.nextUrl.searchParams.get('count');
    const count = Math.min(Math.max(parseInt(countParam || '1') || 1, 1), 10);

    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < count; i++) {
      let lastError: any = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(NFTOKEN_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'MazVall-API-Platform/1.0' },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(30000),
          });

          const data = await response.json();

          if (data.success && data.token) {
            results.push({
              index: i + 1,
              token: data.token,
              tokenPreview: data.token.substring(0, 50) + '...',
              expiry: data.expiry,
              country: data.profile?.country || 'Unknown',
              plan: data.profile?.plan || 'Unknown',
              links: data.links,
              type: data.type,
            });
            lastError = null;
            break;
          } else {
            lastError = data.error || 'Gagal generate token';
            if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY);
          }
        } catch (err: any) {
          lastError = err.message || 'Request gagal';
          if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY);
        }
      }
      if (lastError) {
        errors.push({ index: i + 1, error: lastError });
      }
    }

    await logApiUsage(auth.keyId, auth.user.userId, SERVICE_PATH, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    const summary = {
      total: count,
      success: results.length,
      failed: errors.length,
      timestamp: new Date().toISOString(),
      data: results,
      errors: errors,
    };

    if (count === 1 && results.length === 1) {
      return NextResponse.json({
        success: true,
        author: 'mazval',
        endpoint: '/api/tools/nftoken-generate',
        data: results[0],
      }, {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return NextResponse.json({
      success: true,
      author: 'mazval',
      endpoint: '/api/tools/nftoken-generate',
      data: summary,
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server', endpoint: '/api/tools/nftoken-generate' }, { status: 500 });
  }
}
