import { prisma } from '@/lib/prisma';
import { generateApiKeyString } from '@/lib/db';

export const OPEN_KEY_NAME = 'Open Endpoint (Rahasia)';
export const OPEN_PREFIX = '/open';

// Namespace layanan publik yang boleh dijangkau lewat jalur tanpa key.
// Akun/pembayaran/admin sengaja tidak masuk daftar ini.
export const OPEN_NAMESPACES = [
  'ai', 'download', 'image', 'info', 'mimo',
  'r', 'random', 's', 'stalk', 'sticker', 'tempmail', 'tools',
];

const rpm = Number(process.env.OPEN_RPM) || 60;
const rph = Number(process.env.OPEN_RPH) || 3000;
const rpd = Number(process.env.OPEN_RPD) || 50000;

export const OPEN_RATE_LIMITS = { rpm, rph, rpd };

export function isOpenKeyFormat(key: string): boolean {
  return /^MVAL-[A-Za-z0-9_-]{4,60}$/.test(key);
}

// Ubah sisa path menjadi target /api/... yang sah, atau null jika di luar jalur layanan.
export function resolveOpenTarget(segments: string[]): string | null {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  if (segments.some(s => !s || s === '.' || s === '..' || s.includes('/') || s.includes('\\') || s.includes('\0'))) {
    return null;
  }

  const rel = `/${segments.join('/')}`;
  const target = rel === '/api' || rel.startsWith('/api/') ? rel : `/api${rel}`;
  if (!target.startsWith('/api/')) return null;

  const namespace = target.slice('/api/'.length).split('/')[0];
  if (!OPEN_NAMESPACES.includes(namespace)) return null;

  return target;
}

export function buildOpenBaseUrl(origin: string, key: string): string {
  return `${origin.replace(/\/+$/, '')}${OPEN_PREFIX}/${key}`;
}

export async function ensureOpenKey(adminUserId: string) {
  const existing = await prisma.apiKey.findFirst({
    where: { userId: adminUserId, name: OPEN_KEY_NAME },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    if (existing.active) return existing;
    return prisma.apiKey.update({ where: { id: existing.id }, data: { active: true } });
  }

  return prisma.apiKey.create({
    data: {
      key: generateApiKeyString(),
      name: OPEN_KEY_NAME,
      userId: adminUserId,
      rateLimit: rpm,
    },
  });
}

export async function rotateOpenKey(adminUserId: string) {
  const key = await ensureOpenKey(adminUserId);
  return prisma.apiKey.update({
    where: { id: key.id },
    data: { key: generateApiKeyString(), lastUsedAt: null },
  });
}

// Kuota terpisah untuk jalur tanpa key supaya pemakaian publik tidak menggerus
// kuota utama admin (yang memang tanpa batas karena role admin).
export async function checkOpenRateLimit(keyId: string): Promise<{ allowed: boolean; remaining: number; limit: number; retryAfter: number }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const minAgo = new Date(now.getTime() - 60 * 1000);

  const [minCount, hourCount, dayCount] = await Promise.all([
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: minAgo } } }),
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: hourAgo } } }),
    prisma.usageLog.count({ where: { apiKeyId: keyId, createdAt: { gte: today } } }),
  ]);

  if (minCount >= rpm) return { allowed: false, remaining: 0, limit: rpm, retryAfter: 60 };
  if (hourCount >= rph) return { allowed: false, remaining: 0, limit: rph, retryAfter: 3600 };
  if (dayCount >= rpd) return { allowed: false, remaining: 0, limit: rpd, retryAfter: 86400 };

  return { allowed: true, remaining: rpd - dayCount, limit: rpd, retryAfter: 0 };
}
