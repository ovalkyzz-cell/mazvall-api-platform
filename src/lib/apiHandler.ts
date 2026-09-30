import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage, ApiKeyUser } from '@/lib/apikey';
import { hasAccess } from '@/lib/featureAccess';
import { getFreeApiHandler, isFreeApiAvailable } from '@/lib/freeApis';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://api-faa.my.id/faa';

// Endpoint AI yang boleh dipakai free tier, berdasarkan path yang diminta user
// (bukan path upstream). Beberapa route sengaja dialihkan ke upstream lain,
// misal /api/ai/chatgpt -> upstream gptoss120b, jadi pengecekan wajib memakai
// path asli supaya route alias seperti /api/ai/copilot tidak ikut terbuka.
const FREE_AI_ENDPOINTS = [
  '/api/ai/chatgpt',
  '/api/ai/gptoss120b',
  '/api/ai/gemini',
  '/api/ai/deepseekr1',
];

function resolveEndpoint(req: NextRequest, fallback: string): string {
  const path = (req.nextUrl.pathname || '').replace(/\/+$/, '');
  return path.startsWith('/api/') ? path : fallback;
}

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

export type AuthOk = { auth: { user: ApiKeyUser; keyId: string } };
export type AuthResult = AuthOk | { response: NextResponse };

export async function authenticateRequest(req: NextRequest, servicePath: string): Promise<AuthResult> {
  const endpoint = resolveEndpoint(req, servicePath);
  const auth = await validateApiKey(req);
  if (!auth) {
    return { response: NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint }, { status: 401 }) };
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

    if (!hasAccess(featureAccess, endpoint)) {
      return {
        response: NextResponse.json({
          success: false,
          error: 'Paket kamu tidak memiliki akses ke endpoint ini. Upgrade ke paket berbayar untuk akses penuh.',
          endpoint,
        }, { status: 403 }),
      };
    }

    const tier = auth.user.tier || 'free';
    if ((tier === 'free' || tier === 'Gratis') && !auth.user.planId) {
      if (endpoint.startsWith('/api/ai/') && !FREE_AI_ENDPOINTS.includes(endpoint)) {
        return {
          response: NextResponse.json({
            success: false,
            error: 'Free tier hanya bisa akses: chatgpt, gemini, deepseekr1. Upgrade ke paket berbayar untuk akses semua AI.',
            endpoint,
            available_for_free: FREE_AI_ENDPOINTS,
          }, { status: 403 }),
        };
      }
    }
  }

  const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
  if (!rateCheck.allowed) {
    return {
      response: NextResponse.json({
        success: false,
        error: 'Batas rate limit tercapai',
        data: { limit: rateCheck.limit, remaining: rateCheck.remaining },
      }, { status: 429 }),
    };
  }

  return { auth: { user: auth.user, keyId: auth.keyId } };
}

export function createApiHandler(servicePath: string) {
  return async function handler(req: NextRequest) {
    try {
      const authResult = await authenticateRequest(req, servicePath);
      if ('response' in authResult) {
        return authResult.response;
      }
      const auth = authResult.auth;
      const endpoint = resolveEndpoint(req, servicePath);

      const params = new URLSearchParams(req.nextUrl.searchParams);
      const prompt = params.get('prompt') || params.get('q') || params.get('query') || '';

      if (endpoint.startsWith('/api/ai/')) {
        const hasAnyParam = [...req.nextUrl.searchParams.keys()].some(k => k !== 'apikey');
        if (!hasAnyParam) {
          return NextResponse.json({
            success: false,
            error: 'Parameter wajib diisi. Tambahkan ?prompt=... (atau q / query).',
            endpoint,
          }, { status: 400 });
        }

        const upstream = await tryUpstream(servicePath, params);
        if (upstream.ok && upstream.data) {
          const raw = JSON.stringify(upstream.data).replace(/keyra/gi, 'MazVal');
          const sanitized = JSON.parse(raw);
          if ('author' in sanitized) sanitized.author = 'mazval';
          sanitized.endpoint = endpoint;
          await logApiUsage(auth.keyId, auth.user.userId, endpoint, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);
          return NextResponse.json(sanitized, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const pollResult = await callPollinationsAI(prompt);
        if (pollResult.ok) {
          await logApiUsage(auth.keyId, auth.user.userId, endpoint, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);
          return NextResponse.json({ ...pollResult.data, endpoint }, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        return NextResponse.json({
          success: false,
          error: 'Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.',
          endpoint,
        }, { status: 502 });
      }

      if (isFreeApiAvailable(endpoint)) {
        const freeApiHandler = getFreeApiHandler(endpoint);
        if (freeApiHandler) {
          try {
            const result = await freeApiHandler(params);
            if (result) {
              await logApiUsage(auth.keyId, auth.user.userId, endpoint, 'GET', 200, req.headers.get('x-forwarded-for') || undefined);
              return NextResponse.json({ ...result, endpoint }, {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              });
            }
          } catch (err: any) {
            if (err?.status && err?.publicMessage) {
              return NextResponse.json({
                success: false,
                error: err.message,
                endpoint,
              }, { status: err.status });
            }
            return NextResponse.json({
              success: false,
              error: 'Free API sedang tidak tersedia. Silakan coba lagi.',
              endpoint,
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
        sanitized.endpoint = endpoint;
        await logApiUsage(auth.keyId, auth.user.userId, endpoint, 'GET', upstream.status || 200, req.headers.get('x-forwarded-for') || undefined);
        return NextResponse.json(sanitized, {
          status: upstream.status || 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Layanan upstream untuk endpoint ini sedang tidak tersedia. Silakan coba lagi nanti.',
        endpoint,
      }, { status: 502 });

    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
    }
  };
}
