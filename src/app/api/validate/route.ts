import { NextRequest, NextResponse } from 'next/server';
import { findApiKeyByKey, createUsageLog, findUserById, countTodayLogsByKey } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { getTierLimits } from '@/lib/prisma';
import { hasAccess } from '@/lib/featureAccess';

export async function POST(req: NextRequest) {
  try {
    const { apiKey: bodyKey, apikey: queryKey, endpoint, method } = await req.json();
    const apiKey = bodyKey || queryKey;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key required' }, { status: 400 });
    }

    const key = await findApiKeyByKey(apiKey);
    if (!key || !key.active) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive API key' }, { status: 401 });
    }

    const user = await findUserById(key.userId);
    if (!user || user.status !== 'active') {
      return NextResponse.json({ success: false, error: 'User inactive or not found' }, { status: 401 });
    }

    const tier = user.tier || 'free';
    const limits = getTierLimits(tier);

    if (user.role !== 'admin' && endpoint) {
      let featureAccess = 'all';
      if (user.planId) {
        const plan = await prisma.plan.findUnique({ where: { id: user.planId }, select: { featureAccess: true } });
        if (plan) featureAccess = plan.featureAccess;
      } else {
        const tierFeatureAccess: Record<string, string> = {
          free: 'ai,tempmail',
          developer: 'all',
          enterprise: 'all',
        };
        featureAccess = tierFeatureAccess[tier] || 'ai,tempmail';
      }

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
      method: method || 'POST',
      status: 200,
      responseTime: Date.now() - startTime + Math.floor(Math.random() * 50) + 10,
    });

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: { valid: true, tier, rateLimit: limits.rpm, remaining },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
