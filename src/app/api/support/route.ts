import { NextRequest, NextResponse } from 'next/server';
import { getTicketsByUserId, createTicket } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { subject, message, category, priority } = await req.json();
    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Subject and message required' }, { status: 400 });
    }

    const ticket = createTicket(user.userId, { subject, message, category, priority });
    return successResponse({ ticket }, 'Ticket created');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const tickets = getTicketsByUserId(user.userId);
    return successResponse({ tickets });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
