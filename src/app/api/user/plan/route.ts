import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailable } from '@/lib/staticAuth';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mazvall-fallback-secret';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      tier?: string;
      name?: string;
      status?: string;
    };
  } catch {
    return null;
  }
}

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return req.cookies.get('mazvall_token')?.value || null;
}

// undefined = database mati; null = pengguna tidak ditemukan
async function findUserPlan(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tier: true,
        planId: true,
        planExpiry: true,
        requestsToday: true,
        lastRequestReset: true,
      },
    });
  } catch (err: any) {
    if (!isDbUnavailable(err)) throw err;
    console.error('User plan: database tidak terjangkau:', err?.message || err);
    return undefined;
  }
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

    const user = await findUserPlan(decoded.userId);
    if (user === undefined) {
      // database mati → ambil dari klaim JWT agar panel tidak rusak
      return NextResponse.json({
        success: true,
        data: {
          tier: decoded.tier || (decoded.userId === 'static-admin' ? 'enterprise' : 'free'),
          planId: null,
          planExpiry: null,
          requestsToday: 0,
          isExpired: false,
          plan: null,
        },
      });
    }

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
