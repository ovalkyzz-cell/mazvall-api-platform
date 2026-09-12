import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats, getDailyUsage, getTierDistribution, getRecentLogs } from '@/lib/db';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const stats = getAdminStats();
    const dailyUsage = getDailyUsage(14);
    const tierDistribution = getTierDistribution();
    const recentLogs = getRecentLogs(20);

    return successResponse({ stats, dailyUsage, tierDistribution, recentLogs });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
