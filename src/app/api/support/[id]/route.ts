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

    const ticket = findTicketById(params.id);
    if (!ticket || ticket.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const reply = addTicketReply(params.id, user.userId, message, false);
    return successResponse({ reply }, 'Reply sent');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const ticket = findTicketById(params.id);
    if (!ticket || ticket.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return successResponse({ ticket });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
