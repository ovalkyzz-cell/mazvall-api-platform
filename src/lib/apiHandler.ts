import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage, proxyToService } from '@/lib/apikey';
import { hasAccess } from '@/lib/featureAccess';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://api-faa.my.id/faa';

const FREE_AI_ENDPOINTS = [
  '/api/ai/gptoss120b',
  '/api/ai/gemini',
  '/api/ai/deepseekr1',
];

export function createApiHandler(servicePath: string) {
  return async function handler(req: NextRequest) {
    try {
      const auth = await validateApiKey(req);
      if (!auth) {
        return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: servicePath }, { status: 401 });
      }

      if (auth.user.role !== 'admin') {
        let featureAccess = 'all';
        if (auth.user.planId) {
          const plan = await prisma.plan.findUnique({ where: { id: auth.user.planId }, select: { featureAccess: true } });
          if (plan) featureAccess = plan.featureAccess;
        } else {
          const tier = auth.user.tier || 'free';
          const tierFeatureAccess: Record<string, string> = {
            free: 'ai,tempmail',
            Gratis: 'ai,tempmail',
            developer: 'all',
            enterprise: 'all',
          };
          featureAccess = tierFeatureAccess[tier] || 'ai,tempmail';
        }

        if (!hasAccess(featureAccess, servicePath)) {
          return NextResponse.json({
            success: false,
            error: 'Paket kamu tidak memiliki akses ke endpoint ini. Upgrade ke paket berbayar untuk akses penuh.',
            endpoint: servicePath,
          }, { status: 403 });
        }

        const tier = auth.user.tier || 'free';
        if ((tier === 'free' || tier === 'Gratis') && !auth.user.planId) {
          if (servicePath.startsWith('/api/ai/') && !FREE_AI_ENDPOINTS.includes(servicePath)) {
            return NextResponse.json({
              success: false,
              error: 'Free tier hanya bisa akses: chatgpt, gemini, deepseekr1. Upgrade ke paket berbayar untuk akses semua AI.',
              endpoint: servicePath,
              available_for_free: FREE_AI_ENDPOINTS,
            }, { status: 403 });
          }
        }
      }

      const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
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
        const raw = JSON.stringify(body).replace(/keyra/gi, 'MazVal');
        const sanitized = JSON.parse(raw);
        if ('author' in sanitized) sanitized.author = 'mazval';
        if (sanitized.result && typeof sanitized.result === 'object') {
          if ('author' in sanitized.result) sanitized.result.author = 'mazval';
        }
        sanitized.endpoint = servicePath;
        body = sanitized;
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
