import { NextRequest, NextResponse } from 'next/server';
import { findTicketById, addTicketReply } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    const ticket = await findTicketById(params.id);
    if (!ticket || ticket.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const reply = await addTicketReply(params.id, user.userId, message, user.role === 'admin');
    return successResponse({ reply }, 'Reply sent');
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const ticket = await findTicketById(params.id);
    if (!ticket || ticket.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return successResponse({ ticket });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
