import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage, proxyToService } from '@/lib/apikey';

const BASE_URL = 'https://www.keyrafara.com';

export function createApiHandler(servicePath: string) {
  return async function handler(req: NextRequest) {
    try {
      const auth = await validateApiKey(req);
      if (!auth) {
        return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: servicePath }, { status: 401 });
      }

      const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role);
      if (!rateCheck.allowed) {
        return NextResponse.json({
          success: false,
          error: 'Batas rate limit tercapai',
          data: { limit: rateCheck.limit, remaining: rateCheck.remaining },
        }, { status: 429 });
      }

      const targetUrl = `${BASE_URL}${servicePath}`;
      const response = await proxyToService(targetUrl, req);

      let body: any;
      try {
        body = await response.json();
      } catch {
        return response;
      }

      if (body && typeof body === 'object') {
        if ('author' in body) body.author = 'mazval';
        if (body.result && typeof body.result === 'object') {
          if ('author' in body.result) body.result.author = 'mazval';
        }
        body.endpoint = servicePath;
      }

      await logApiUsage(
        auth.keyId, auth.user.userId, servicePath, 'GET',
        response.status, req.headers.get('x-forwarded-for') || undefined
      );

      return NextResponse.json(body, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
    }
  };
}
