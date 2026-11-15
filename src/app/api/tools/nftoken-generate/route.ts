import { NextRequest, NextResponse } from 'next/server';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

const NFTOKEN_BASE = 'https://nftoken.zone.id/api/auto-generate';
const SERVICE_PATH = '/tools/nftoken-generate';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
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
