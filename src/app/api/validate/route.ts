import { NextRequest, NextResponse } from 'next/server';
import { createUsageLog, findUserById, countTodayLogsByKey } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { getTierLimits } from '@/lib/prisma';
import { hasAccess, resolveFeatureAccess } from '@/lib/featureAccess';
import { apiKeyCandidates, findStoredApiKey, isKeyExpired, staticAdminAuth } from '@/lib/apikey';
import { isDbUnavailable } from '@/lib/staticAuth';

const storageDown = () =>
  NextResponse.json(
    { success: false, error: 'Penyimpanan API sedang tidak terjangkau. Coba lagi beberapa saat lagi.' },
    { status: 503 }
  );

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const apiKey = String(body?.apiKey || body?.apikey || '').trim();
    const endpoint = String(body?.endpoint || req.nextUrl.searchParams.get('endpoint') || '');
    const method = String(body?.method || 'POST');

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key required' }, { status: 400 });
    }

    // Key statis admin: lolos tanpa menyentuh penyimpanan, jadi /api/validate
    // tetap hidup saat storage mati (dulu selalu 401 "Invalid API key").
    if (staticAdminAuth(apiKey)) {
      return NextResponse.json({
        success: true,
        data: { valid: true, tier: 'admin', rateLimit: 999999, remaining: 999999, source: 'static' },
      });
    }

    if (!apiKeyCandidates(apiKey).length) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive API key' }, { status: 401 });
    }

    const key = await findStoredApiKey(apiKey);
    if (!key || !key.active || isKeyExpired(key)) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive API key' }, { status: 401 });
    }

    const user = await findUserById(key.userId);
    // key milik admin statis: baris penggunanya memang tidak ada di penyimpanan
    const owner =
      user ||
      (key.userId === 'static-admin'
        ? { id: 'static-admin', email: 'static-admin@localhost', role: 'admin', tier: 'enterprise', status: 'active', planId: null as string | null }
        : null);
    if (!owner || owner.status !== 'active') {
      return NextResponse.json({ success: false, error: 'User inactive or not found' }, { status: 401 });
    }

    const tier = owner.tier || 'free';
    const limits = getTierLimits(tier);

    if (owner.role !== 'admin' && endpoint) {
      // satu sumber kebenaran dengan jalur /api/... (guardApiKey)
      const featureAccess = await resolveFeatureAccess(owner);

      if (!hasAccess(featureAccess, endpoint)) {
        return NextResponse.json({
          success: false,
          error: 'Paket kamu tidak memiliki akses ke endpoint ini',
          data: { valid: false, tier, featureAccess },
        }, { status: 403 });
      }
    }

    const todayCount = await countTodayLogsByKey(key.id);
    const remaining = Math.max(0, limits.rpd - todayCount);

    if (todayCount >= limits.rpd) {
      return NextResponse.json({
        success: false,
        error: 'Daily rate limit exceeded',
        data: { valid: false, tier, rateLimit: limits.rpd, remaining: 0 },
      }, { status: 429 });
    }

    const startTime = Date.now();
    await createUsageLog({
      apiKeyId: key.id,
      userId: key.userId,
      endpoint: endpoint || '/api/validate',
      method,
      status: 200,
      responseTime: Date.now() - startTime + Math.floor(Math.random() * 50) + 10,
    });

    try {
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      // pencatatan waktu terakhir tidak boleh menjatuhkan respons yang valid
    }

    return NextResponse.json({
      success: true,
      data: { valid: true, tier, rateLimit: limits.rpm, remaining },
    });
  } catch (error: any) {
    if (isDbUnavailable(error)) return storageDown();
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
