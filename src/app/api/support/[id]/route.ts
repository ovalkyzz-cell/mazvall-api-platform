import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, userId: user.userId },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        message,
        ticketId: params.id,
        userId: user.userId,
        isAdmin: false,
      },
    });

    return successResponse({ reply }, 'Reply sent');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, userId: user.userId },
      include: { replies: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } } },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return successResponse({ ticket });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
