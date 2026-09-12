import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const dbUser = findUserById(user.userId);
    if (!dbUser) return authResponse('User not found');

    const { password, ...safe } = dbUser;
    return successResponse({ user: safe });
  } catch (error) {
    return authResponse('Unauthorized');
  }
}
