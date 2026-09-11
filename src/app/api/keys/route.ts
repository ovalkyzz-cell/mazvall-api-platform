import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateApiKey, getTierLimits } from '@/lib/prisma';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.userId },
      include: { _count: { select: { usageLogs: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ keys });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { name } = await req.json();
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return authResponse('User not found');

    const limits = getTierLimits(dbUser.tier);
    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        userId: user.userId,
        rateLimit: limits.rpm,
      },
    });

    return successResponse({ apiKey }, 'API key created');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
