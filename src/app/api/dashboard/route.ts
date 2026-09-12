import { NextRequest, NextResponse } from 'next/server';
import { getLogsByUserId, countLogsByUser, getKeysByUserId, getDailyUsage } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [logs, keys, todayCount, weekCount, monthCount, dailyUsage] = await Promise.all([
      getLogsByUserId(user.userId),
      getKeysByUserId(user.userId),
      countLogsByUser(user.userId, today),
      countLogsByUser(user.userId, thisWeek),
      countLogsByUser(user.userId, thisMonth),
      getDailyUsage(7),
    ]);

    return successResponse({
      keys,
      logs,
      stats: { todayCount, weekCount, monthCount, totalKeys: keys.length },
      dailyUsage: dailyUsage.map((d) => ({ ...d, count: d.requests })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
