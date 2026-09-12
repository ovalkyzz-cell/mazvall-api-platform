import { NextRequest, NextResponse } from 'next/server';
import { findTicketById, addTicketReply } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    const ticket = await findTicketById(params.id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const reply = await addTicketReply(params.id, admin.userId, message, true);
    return successResponse({ reply }, 'Reply sent');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);

    const ticket = await findTicketById(params.id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return successResponse({ ticket });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    const { status } = await req.json();

    if (!status || !['open', 'pending', 'closed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: { status },
    });

    return successResponse({ ticket }, 'Ticket status updated');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
