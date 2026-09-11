import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, role: true, tier: true, createdAt: true },
    });

    if (!dbUser) return authResponse('User not found');

    return successResponse({ user: dbUser });
  } catch (error) {
    return authResponse('Unauthorized');
  }
}
