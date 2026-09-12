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

    const logs = getLogsByUserId(user.userId);
    const keys = getKeysByUserId(user.userId);

    const todayCount = countLogsByUser(user.userId, today);
    const weekCount = countLogsByUser(user.userId, thisWeek);
    const monthCount = countLogsByUser(user.userId, thisMonth);
    const totalKeys = keys.length;

    const dailyUsage = getDailyUsage(7);

    return successResponse({
      logs: logs.map((l) => ({ ...l, apiKey: keys.find((k) => k.id === l.apiKeyId) ? { name: keys.find((k) => k.id === l.apiKeyId)!.name, key: keys.find((k) => k.id === l.apiKeyId)!.key } : null })),
      stats: { todayCount, weekCount, monthCount, totalKeys },
      dailyUsage: dailyUsage.map((d) => ({ ...d, count: d.requests })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
