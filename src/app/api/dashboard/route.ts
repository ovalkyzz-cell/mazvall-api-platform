import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const logs = await prisma.usageLog.findMany({
      where: { userId: user.userId },
      include: { apiKey: { select: { name: true, key: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Usage stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount, totalKeys] = await Promise.all([
      prisma.usageLog.count({ where: { userId: user.userId, createdAt: { gte: today } } }),
      prisma.usageLog.count({ where: { userId: user.userId, createdAt: { gte: thisWeek } } }),
      prisma.usageLog.count({ where: { userId: user.userId, createdAt: { gte: thisMonth } } }),
      prisma.apiKey.count({ where: { userId: user.userId, active: true } }),
    ]);

    // Daily usage for chart (last 7 days)
    const dailyUsage = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = await prisma.usageLog.count({
        where: { userId: user.userId, createdAt: { gte: dayStart, lt: dayEnd } },
      });
      dailyUsage.push({ date: dayStart.toISOString().split('T')[0], count });
    }

    return successResponse({
      logs,
      stats: { todayCount, weekCount, monthCount, totalKeys },
      dailyUsage,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
