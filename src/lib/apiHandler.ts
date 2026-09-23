import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';
import { hasAccess } from '@/lib/featureAccess';
import { getFreeApiHandler, isFreeApiAvailable } from '@/lib/freeApis';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://api-faa.my.id/faa';

const FREE_AI_ENDPOINTS = [
  '/api/ai/gptoss120b',
  '/api/ai/gemini',
  '/api/ai/deepseekr1',
];

async function callPollinationsAI(prompt: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://text.pollinations.ai/${encodedPrompt}?model=openai`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(60000),
    });

    const text = await res.text();

    if (res.status === 200 && text && !text.includes('"error"') && !text.includes('budget')) {
      return {
        ok: true,
        data: {
          status: true,
          creator: 'mazval',
          result: text.trim(),
        },
      };
    }

    return { ok: false, error: text || 'Pollinations returned empty response' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Pollinations timeout' };
  }
}

async function tryUpstream(servicePath: string, params: URLSearchParams): Promise<{ ok: boolean; data?: any; status?: number }> {
  const upstreamPath = servicePath.replace(/^\/api\//, '/');
  const urlObj = new URL(`${BASE_URL}${upstreamPath}`);
  params.forEach((value, key) => {
    if (key !== 'apikey') urlObj.searchParams.set(key, value);
  });

  try {
    const res = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://api-faa.my.id/',
      },
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    const isCF = text.includes('Just a moment') || text.includes('cf_chl_opt') || text.includes('challenge-platform') || text.includes('Enable JavaScript and cookies to continue');

    if (isCF || res.status === 403 || res.status === 404) {
      return { ok: false, status: res.status };
    }

    try {
      const body = JSON.parse(text);
      if (body && typeof body === 'object' && (body.status === true || body.status === false || body.result || body.data)) {
        return { ok: true, data: body, status: res.status };
      }
    } catch {}
    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 502 };
  }
}

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

      const params = new URLSearchParams(req.nextUrl.searchParams);
      const prompt = params.get('prompt') || params.get('q') || params.get('query') || '';

      if (servicePath.startsWith('/api/ai/')) {
        const upstream = await tryUpstream(servicePath, params);
        if (upstream.ok && upstream.data) {
          const raw = JSON.stringify(upstream.data).replace(/keyra/gi, 'MazVal');
          const sanitized = JSON.parse(raw);
          if ('author' in sanitized) sanitized.author = 'mazval';
          sanitized.endpoint = servicePath;
          await logApiUsage(auth.keyId, auth.user.userId, servicePath, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);
          return NextResponse.json(sanitized, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const pollResult = await callPollinationsAI(prompt);
        if (pollResult.ok) {
          await logApiUsage(auth.keyId, auth.user.userId, servicePath, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);
          return NextResponse.json({ ...pollResult.data, endpoint: servicePath }, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        return NextResponse.json({
          success: false,
          error: 'AI sedang sibuk atau tidak tersedia saat ini. Silakan coba lagi.',
          endpoint: servicePath,
        }, { status: 503 });
      }

      if (isFreeApiAvailable(servicePath)) {
        const freeApiHandler = getFreeApiHandler(servicePath);
        if (freeApiHandler) {
          try {
            const result = await freeApiHandler(params);
            if (result) {
              await logApiUsage(auth.keyId, auth.user.userId, servicePath, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);
              return NextResponse.json({ ...result, endpoint: servicePath }, {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              });
            }
          } catch (err: any) {
            return NextResponse.json({
              success: false,
              error: 'Free API sedang tidak tersedia. Silakan coba lagi.',
              endpoint: servicePath,
            }, { status: 503 });
          }
        }
      }

      const upstream = await tryUpstream(servicePath, params);
      if (upstream.ok && upstream.data) {
        const raw = JSON.stringify(upstream.data).replace(/keyra/gi, 'MazVal');
        const sanitized = JSON.parse(raw);
        if ('author' in sanitized) sanitized.author = 'mazval';
        if (sanitized.result && typeof sanitized.result === 'object' && 'author' in sanitized.result) sanitized.result.author = 'mazval';
        sanitized.endpoint = servicePath;
        await logApiUsage(auth.keyId, auth.user.userId, servicePath, 'GET', upstream.status || 200, req.headers.get('x-forwarded-for') || undefined);
        return NextResponse.json(sanitized, {
          status: upstream.status || 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Endpoint sedang dalam maintenance. Silakan coba lagi nanti.',
        endpoint: servicePath,
      }, { status: 503 });

    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
    }
  };
}
