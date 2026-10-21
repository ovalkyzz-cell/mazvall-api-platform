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

    const ticket = await createTicket(user.userId, { subject, message, category, priority });
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Layanan tiket sedang tidak aktif. Silakan coba lagi beberapa saat lagi.' },
        { status: 503 }
      );
    }
    return successResponse({ ticket }, 'Ticket created');
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const tickets = await getTicketsByUserId(user.userId);
    return successResponse({ tickets });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
