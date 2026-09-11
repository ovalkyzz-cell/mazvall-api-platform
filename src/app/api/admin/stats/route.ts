import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalKeys, totalRequests, todayRequests, activeKeys] = await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.usageLog.count(),
      prisma.usageLog.count({ where: { createdAt: { gte: today } } }),
      prisma.apiKey.count({ where: { active: true } }),
    ]);

    // Daily usage for chart (last 14 days)
    const dailyUsage = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = await prisma.usageLog.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });
      dailyUsage.push({ date: dayStart.toISOString().split('T')[0], requests: count });
    }

    // Tier distribution
    const tierDistribution = await prisma.user.groupBy({
      by: ['tier'],
      _count: true,
    });

    // Recent activity
    const recentLogs = await prisma.usageLog.findMany({
      take: 20,
      include: { user: { select: { name: true, email: true } }, apiKey: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      stats: { totalUsers, totalKeys, totalRequests, todayRequests, activeKeys },
      dailyUsage,
      tierDistribution,
      recentLogs,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
