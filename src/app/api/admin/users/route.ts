import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const users = await getAllUsers();
    const usersWithStatus = users.map((user: any) => ({
      ...user,
      status: user.status || 'active',
    }));
    return successResponse({ users: usersWithStatus });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
