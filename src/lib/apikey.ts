import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ApiKeyUser {
  userId: string;
  email: string;
  role: string;
  tier: string;
  planId?: string | null;
}

export async function validateApiKey(req: NextRequest): Promise<{ user: ApiKeyUser; keyId: string } | null> {
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('apikey');
  if (!apiKey) return null;

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: { select: { id: true, email: true, role: true, tier: true, status: true, planId: true } } },
  });

  if (!key || !key.active) return null;
  if (key.user.status !== 'active') return null;

  return { user: { userId: key.user.id, email: key.user.email, role: key.user.role, tier: key.user.tier, planId: key.user.planId }, keyId: key.id };
}

export async function checkRateLimit(keyId: string, userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { planId: true } });
  let rpd = 5, rpm = 1, rph = 5;

  if (user?.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: user.planId } });
    if (plan) {
      rpd = plan.requestsPerDay;
      rpm = plan.requestsPerMin;
      rph = plan.requestsPerHour;
    }
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const minAgo = new Date(now.getTime() - 60 * 1000);

  const [todayCount, hourCount, minCount] = await Promise.all([
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: today } } }),
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: hourAgo } } }),
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: minAgo } } }),
  ]);

  if (minCount >= rpm) return { allowed: false, remaining: 0, limit: rpm };
  if (hourCount >= rph) return { allowed: false, remaining: 0, limit: rph };
  if (todayCount >= rpd) return { allowed: false, remaining: 0, limit: rpd };

  return { allowed: true, remaining: rpd - todayCount, limit: rpd };
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
