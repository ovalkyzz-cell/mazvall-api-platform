import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';
import { getRevenueStats, getRevenueByPlan, getDailyRevenue, getRecentTransactions, getMonthlyRevenue } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const params = new URLSearchParams(req.nextUrl.searchParams);
    const action = params.get('action') || 'stats';
    const days = parseInt(params.get('days') || '30');
    const year = parseInt(params.get('year') || new Date().getFullYear().toString());
    const limit = parseInt(params.get('limit') || '20');

    switch (action) {
      case 'stats': {
        const stats = await getRevenueStats();
        return successResponse({ revenue: stats });
      }
      case 'by-plan': {
        const byPlan = await getRevenueByPlan();
        return successResponse({ revenueByPlan: byPlan });
      }
      case 'daily': {
        const daily = await getDailyRevenue(days);
        const totalDaily = daily.reduce((sum, d) => sum + d.revenue, 0);
        return successResponse({ daily, totalDaily, days });
      }
      case 'monthly': {
        const monthly = await getMonthlyRevenue(year);
        const totalMonthly = monthly.reduce((sum, m) => sum + m.revenue, 0);
        return successResponse({ monthly, totalMonthly, year });
      }
      case 'transactions': {
        const transactions = await getRecentTransactions(limit);
        return successResponse({ transactions });
      }
      default:
        return NextResponse.json({
          success: false,
          error: 'Action tidak valid. Gunakan: stats, by-plan, daily, monthly, transactions',
        }, { status: 400 });
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
