import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signUserToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { isDbUnavailable } from '@/lib/staticAuth';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not set in environment variables');
}

const registerAttempts = new Map<string, { count: number; resetTime: number }>();

const MAX_REGISTER_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

function checkRegisterRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = registerAttempts.get(ip);

  if (!entry || now > entry.resetTime) {
    registerAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (entry.count >= MAX_REGISTER_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password minimal 8 karakter' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password maksimal 128 karakter' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung minimal 1 huruf' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung minimal 1 angka' };
  }
  if (password.includes(' ')) {
    return { valid: false, error: 'Password tidak boleh mengandung spasi' };
  }
  return { valid: true };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}

// undefined = database mati; null = email belum terdaftar
async function findExistingUser(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    if (!isDbUnavailable(err)) throw err;
    console.error('Register: database tidak terjangkau:', (err as any)?.message || err);
    return undefined;
  }
}

async function createUserRecord(email: string, name: string, hashed: string) {
  try {
    return await prisma.user.create({
      data: { email, name, password: hashed, role: 'user', tier: 'free', status: 'pending' },
    });
  } catch (err) {
    if (!isDbUnavailable(err)) throw err;
    console.error('Register: database tidak terjangkau:', (err as any)?.message || err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const rateCheck = checkRegisterRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Terlalu banyak percobaan registrasi. Coba lagi dalam ${Math.ceil((rateCheck.retryAfter || 0) / 60)} menit.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Format input tidak valid' }, { status: 400 });
    }

    if (email.length > 255 || password.length > 128 || name.length > 100) {
      return NextResponse.json({ success: false, error: 'Input terlalu panjang' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid' }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ success: false, error: passwordCheck.error }, { status: 400 });
    }

    const sanitizedName = sanitizeInput(name);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json({ success: false, error: 'Nama harus 2-100 karakter' }, { status: 400 });
    }

    const blockedDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com', 'yopmail.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(emailDomain)) {
      return NextResponse.json({ success: false, error: 'Domain email tidak diizinkan' }, { status: 400 });
    }

    const existing = await findExistingUser(email.toLowerCase());
    if (existing === undefined) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran belum dapat diproses karena layanan database sedang tidak aktif. Silakan coba lagi beberapa saat lagi.' },
        { status: 503 }
      );
    }
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 14);
    let user: any;
    try {
      user = await createUserRecord(email.toLowerCase(), sanitizedName, hashed);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 409 });
      }
      throw err;
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran belum dapat diproses karena layanan database sedang tidak aktif. Silakan coba lagi beberapa saat lagi.' },
        { status: 503 }
      );
    }

    const token = signUserToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier, status: user.status }, token },
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
    console.error('Register error:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
