import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mazvall-fallback-secret';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return req.cookies.get('mazvall_token')?.value || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tier: true,
        planId: true,
        planExpiry: true,
        requestsToday: true,
        lastRequestReset: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let planDetails = null;
    if (user.planId) {
      planDetails = await prisma.plan.findUnique({ where: { id: user.planId } });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastRequestReset < today) {
      await prisma.user.update({
        where: { id: user.id },
        data: { requestsToday: 0, lastRequestReset: now },
      });
      user.requestsToday = 0;
    }

    const isExpired = user.planExpiry && user.planExpiry < now;

    return NextResponse.json({
      success: true,
      data: {
        tier: user.tier,
        planId: user.planId,
        planExpiry: user.planExpiry,
        requestsToday: user.requestsToday,
        isExpired,
        plan: planDetails,
      },
    });
  } catch (error) {
    console.error('User plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
