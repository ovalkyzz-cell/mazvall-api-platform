import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const minAgo = new Date(now.getTime() - 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      bannedUsers,
      totalKeys,
      activeKeys,
      todayRequests,
      hourRequests,
      minRequests,
      recentLogs,
      topUsers,
      tierDistribution,
      statusDistribution,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'pending' } }),
      prisma.user.count({ where: { status: 'banned' } }),
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { active: true } }),
      prisma.usageLog.count({ where: { createdAt: { gte: today } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: hourAgo } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: minAgo } } }),
      prisma.usageLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, tier: true } },
          apiKey: { select: { name: true, key: true } },
        },
      }),
      prisma.usageLog.groupBy({
        by: ['userId'],
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.user.groupBy({ by: ['tier'], _count: true }),
      prisma.user.groupBy({ by: ['status'], _count: true }),
    ]);

    const topUserIds = topUsers.map((u) => u.userId);
    const topUserData = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, email: true, tier: true },
    });

    const topUsersWithDetails = topUsers.map((u) => {
      const userData = topUserData.find((d) => d.id === u.userId);
      return { ...userData, requestCount: u._count };
    });

    return successResponse({
      overview: {
        totalUsers,
        activeUsers,
        pendingUsers,
        bannedUsers,
        totalKeys,
        activeKeys,
        todayRequests,
        hourRequests,
        minRequests,
        rps: Math.round(minRequests / 60 * 10) / 10,
      },
      recentLogs,
      topUsers: topUsersWithDetails,
      tierDistribution,
      statusDistribution,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
