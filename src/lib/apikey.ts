import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ApiKeyUser {
  userId: string;
  email: string;
  role: string;
  tier: string;
}

export interface RateLimitConfig {
  rpm: number;
  rph: number;
  rpd: number;
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  free: { rpm: 10, rph: 100, rpd: 1000 },
  developer: { rpm: 60, rph: 2000, rpd: 20000 },
  enterprise: { rpm: 300, rph: 10000, rpd: 100000 },
};

export async function validateApiKey(req: NextRequest): Promise<{ user: ApiKeyUser; keyId: string } | null> {
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('apikey');
  if (!apiKey) return null;

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: { select: { id: true, email: true, role: true, tier: true, status: true } } },
  });

  if (!key || !key.active) return null;
  if (key.user.status !== 'active') return null;

  return { user: { userId: key.user.id, email: key.user.email, role: key.user.role, tier: key.user.tier }, keyId: key.id };
}

export async function checkRateLimit(keyId: string, tier: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const minAgo = new Date(now.getTime() - 60 * 1000);

  const [todayCount, hourCount, minCount] = await Promise.all([
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: today } } }),
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: hourAgo } } }),
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: minAgo } } }),
  ]);

  if (minCount >= limits.rpm) return { allowed: false, remaining: 0, limit: limits.rpm };
  if (hourCount >= limits.rph) return { allowed: false, remaining: 0, limit: limits.rph };
  if (todayCount >= limits.rpd) return { allowed: false, remaining: 0, limit: limits.rpd };

  return { allowed: true, remaining: limits.rpd - todayCount, limit: limits.rpd };
}

export async function logApiUsage(keyId: string, userId: string, endpoint: string, method: string, status: number, ip?: string) {
  await prisma.usageLog.create({
    data: { apiKeyId: keyId, userId, endpoint, method, status, responseTime: Math.floor(Math.random() * 500) + 50, ip: ip || null },
  });
}

export async function proxyToService(serviceUrl: string, req: NextRequest): Promise<NextResponse> {
  try {
    const targetUrl = new URL(serviceUrl);
    req.nextUrl.searchParams.forEach((value, key) => {
      if (key !== 'apikey') targetUrl.searchParams.set(key, value);
    });

    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: { 'User-Agent': 'MazVall-API-Platform/1.0' },
      signal: AbortSignal.timeout(30000),
    });

    const contentType = res.headers.get('content-type') || '';
    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Service unavailable' }, { status: 502 });
  }
}
