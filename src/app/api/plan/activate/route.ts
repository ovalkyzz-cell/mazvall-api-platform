import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKeyString } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'planId is required' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ success: false, error: 'Plan not found or inactive' }, { status: 404 });
    }

    if (plan.price > 0) {
      return NextResponse.json({ success: false, error: 'Use payment endpoint for paid plans' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { planId: plan.id, tier: plan.name },
    });

    const existingKey = await prisma.apiKey.findFirst({
      where: { userId: decoded.userId, active: true },
    });

    if (!existingKey) {
      await prisma.apiKey.create({
        data: {
          key: generateApiKeyString(),
          name: 'Default API Key',
          userId: decoded.userId,
          rateLimit: plan.requestsPerDay,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { planId: plan.id, planName: plan.name, message: 'Plan aktif!' },
    });
  } catch (error) {
    console.error('Free plan activate error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
