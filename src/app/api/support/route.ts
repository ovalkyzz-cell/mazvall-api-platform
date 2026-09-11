import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { subject, message, category, priority } = await req.json();
    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Subject and message required' }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        message,
        category: category || 'general',
        priority: priority || 'normal',
        userId: user.userId,
      },
    });

    return successResponse({ ticket }, 'Ticket created');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.userId },
      include: { _count: { select: { replies: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ tickets });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
