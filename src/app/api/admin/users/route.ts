import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);

    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, tier: true, createdAt: true,
        _count: { select: { apiKeys: true, usageLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ users });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
