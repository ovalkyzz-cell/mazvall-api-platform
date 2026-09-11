import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/prisma';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieToken = req.cookies.get('mazvall_token')?.value;
  return cookieToken || null;
}

export function authenticate(req: NextRequest): AuthUser | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = authenticate(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireAdmin(req: NextRequest): AuthUser {
  const user = requireAuth(req);
  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}

export function authResponse(message: string, status: number = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function successResponse(data: any, message?: string) {
  return NextResponse.json({ success: true, data, message });
}
