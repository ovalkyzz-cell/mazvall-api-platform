import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';

export interface StaticAdminProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  status: string;
  planId: string | null;
  planExpiry: Date | null;
  requestsToday: number;
  lastRequestReset: Date;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const STATIC_ADMIN_EMAIL = (process.env.STATIC_ADMIN_EMAIL || 'admin@mazvall.com').toLowerCase();

// deteksi database tidak terjangkau (Neon mati / koneksi putus / engine belum siap)
export function isDbUnavailable(err: unknown): boolean {
  const code = String((err as any)?.code || '');
  const message = String((err as any)?.message || '');
  if (['P1001', 'P1002', 'P1008', 'P1017'].includes(code)) return true;
  return /can't reach database server|connection refused|connection terminated|enotfound|etimedout|econnreset|econnrefused|prismaclientinitialization|engine is not ready|fetch failed|database server/i.test(message);
}

export function matchesStaticAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === STATIC_ADMIN_EMAIL;
}

function constantTimeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // lakukan perbandingan tetap agar timing tidak bocor
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

// kandidat password admin statis: env rahasia operator, atau key API statis
export async function matchesStaticAdminPassword(password: string): Promise<boolean> {
  if (!password || typeof password !== 'string') return false;
  const candidates = [
    process.env.STATIC_ADMIN_PASSWORD,
    ...String(process.env.STATIC_ADMIN_KEYS || '').split(/[,\s]+/),
  ].filter((value): value is string => !!value && value.trim().length > 0);

  for (const candidate of candidates) {
    if (candidate.startsWith('$2a$') || candidate.startsWith('$2b$') || candidate.startsWith('$2y$')) {
      if (await bcrypt.compare(password, candidate)) return true;
    } else if (constantTimeEquals(password, candidate)) {
      return true;
    }
  }
  return false;
}

export function staticAdminProfile(): StaticAdminProfile {
  const now = new Date();
  return {
    id: 'static-admin',
    email: STATIC_ADMIN_EMAIL,
    name: 'Admin Mazvall',
    role: 'admin',
    tier: 'enterprise',
    status: 'active',
    planId: null,
    planExpiry: null,
    requestsToday: 0,
    lastRequestReset: now,
    avatar: null,
    createdAt: now,
    updatedAt: now,
  };
}
