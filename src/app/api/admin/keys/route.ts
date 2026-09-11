import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateApiKey } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);

    const keys = await prisma.apiKey.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ keys });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const { userId, name, rateLimit } = await req.json();

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: 'userId and name required' }, { status: 400 });
    }

    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        userId,
        rateLimit: rateLimit || 100,
      },
    });

    return successResponse({ apiKey }, 'API key generated');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
