import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not set in environment variables');
}

const loginAttempts = new Map<string, { count: number; resetTime: number; lockedUntil?: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_RATE_LIMIT = 10;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  if (entry.count >= MAX_RATE_LIMIT) {
    entry.lockedUntil = now + LOCKOUT_DURATION;
    entry.count = 0;
    return { allowed: false, retryAfter: Math.ceil(LOCKOUT_DURATION / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

function recordFailedAttempt(ip: string): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - 1 };
  }

  entry.count++;

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION;
    return { locked: true, attemptsLeft: 0 };
  }

  return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - entry.count };
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateCheck.retryAfter} detik.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Format input tidak valid' }, { status: 400 });
    }

    if (email.length > 255 || password.length > 128) {
      return NextResponse.json({ success: false, error: 'Input terlalu panjang' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      recordFailedAttempt(ip);
      return NextResponse.json({ success: false, error: 'Email atau password salah' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const result = recordFailedAttempt(ip);
      if (result.locked) {
        return NextResponse.json(
          { success: false, error: 'Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.' },
          { status: 423 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Email atau password salah. Sisa percobaan: ${result.attemptsLeft}` },
        { status: 401 }
      );
    }

    if (user.status === 'banned') {
      return NextResponse.json({ success: false, error: 'Akun anda telah diblokir. Hubungi admin.' }, { status: 403 });
    }
    if (user.status === 'rejected') {
      return NextResponse.json({ success: false, error: 'Akun anda telah ditolak. Hubungi admin.' }, { status: 403 });
    }

    clearAttempts(ip);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET!,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier, status: user.status, planId: user.planId },
        token,
      },
    });

    response.cookies.set('mazvall_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
