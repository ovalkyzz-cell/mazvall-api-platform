import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, endpoint, method } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key required' }, { status: 400 });
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!key || !key.active) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive API key' }, { status: 401 });
    }

    // Check rate limit from usage logs in last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentUsage = await prisma.usageLog.count({
      where: { apiKeyId: key.id, createdAt: { gte: oneMinuteAgo } },
    });

    if (recentUsage >= key.rateLimit) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Log the usage
    await prisma.usageLog.create({
      data: {
        apiKeyId: key.id,
        userId: key.userId,
        endpoint: endpoint || '/api/validate',
        method: method || 'POST',
        status: 200,
        responseTime: Math.floor(Math.random() * 200) + 50,
      },
    });

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        tier: key.user.tier,
        rateLimit: key.rateLimit,
        remaining: key.rateLimit - recentUsage - 1,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
