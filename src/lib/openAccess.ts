import { prisma } from '@/lib/prisma';
import { generateApiKeyString } from '@/lib/db';
import { OPEN_ALIASES, OPEN_ALIASES_LOWER, OPEN_ALIAS_COUNT } from '@/lib/openAliases';

export const OPEN_KEY_NAME = 'Open Endpoint (Rahasia)';
export const OPEN_PREFIX = '/open';
// Prefiks pendek untuk jalur yang sama: /o/{key}/{alias}
export const OPEN_SHORT_PREFIX = '/o';

// Namespace layanan publik yang boleh dijangkau lewat jalur tanpa key.
// Akun/pembayaran/admin sengaja tidak masuk daftar ini.
export const OPEN_NAMESPACES = [
  'ai', 'download', 'image', 'info', 'mimo',
  'r', 'random', 's', 'stalk', 'sticker', 'tempmail', 'tools',
];

// Namespace yang sengaja tidak dibuka lewat jalur tanpa key (dipakai untuk pesan error).
const BLOCKED_NAMESPACES = [
  'admin', 'auth', 'keys', 'support', 'payment', 'plan', 'plans',
  'dashboard', 'coupons', 'discount', 'validate', 'security', 'health', 'user',
];

const rpm = Number(process.env.OPEN_RPM) || 60;
const rph = Number(process.env.OPEN_RPH) || 3000;
const rpd = Number(process.env.OPEN_RPD) || 50000;

export const OPEN_RATE_LIMITS = { rpm, rph, rpd };

// Format key: lengkap (MVAL-xxx, boleh huruf kecil) atau bentuk pendek tanpa awalan (min. 8 karakter).
export function isOpenKeyFormat(key: string): boolean {
  return /^(MVAL-[A-Za-z0-9_-]{4,60}|[A-Za-z0-9_-]{8,60})$/i.test(key);
}

// Deteksi sisa placeholder di URL, mis. /o/{KEY}/gempa
export function hasPlaceholder(value: string): boolean {
  return /[{}]/.test(value);
}

// Cari record key untuk jalur /o/ dan /open/.
// Hanya key AKTIF milik user berstatus aktif; case-insensitive.
// Key jalur rahasia dikenali lewat name = OPEN_KEY_NAME, key biasa tetap diterima
// (perilakunya sama seperti memakai ?apikey= di jalur /api/).
export async function findOpenKey(rawKey: string) {
  const trimmed = rawKey.trim();
  const include = { user: { select: { status: true, role: true } } };

  const exact = await prisma.apiKey.findFirst({
    where: { key: { equals: trimmed, mode: 'insensitive' } },
    include,
  });
  if (exact) return exact;

  // Bentuk pendek tanpa awalan MVAL-: langsung coba MVAL- + isi key (cocok persis,
  // tidak memakai endsWith supaya tidak bisa menyambar key user lain).
  if (!/^mval-/i.test(trimmed)) {
    return prisma.apiKey.findFirst({
      where: { key: { equals: `MVAL-${trimmed}`, mode: 'insensitive' } },
      include,
    });
  }
  return null;
}

// Ubah sisa path menjadi target /api/... yang sah, atau null jika di luar jalur layanan.
// Mendukung alias pendek: /o/{key}/gempa -> /api/info/gempa
export function resolveOpenTarget(segments: string[]): string | null {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  if (segments.some(s => !s || s === '.' || s === '..' || s.includes('/') || s.includes('\\') || s.includes('\0'))) {
    return null;
  }

  let target: string | null = null;
  if (segments.length === 1) {
    const slug = segments[0];
    target = OPEN_ALIASES[slug] ?? OPEN_ALIASES_LOWER[slug.toLowerCase()] ?? null;
  }

  if (!target) {
    const rel = `/${segments.join('/')}`;
    target = rel === '/api' || rel.startsWith('/api/') ? rel : `/api${rel}`;
  }

  if (!target.startsWith('/api/')) return null;

  const namespace = target.slice('/api/'.length).split('/')[0];
  if (!OPEN_NAMESPACES.includes(namespace)) return null;

  return target;
}

// Alasan penolakan resolveOpenTarget() — hanya dipanggil SETELAH key terbukti sah,
// jadi aman memberi pesan yang jelas tanpa membocorkan apa pun ke pihak luar.
export function explainOpenTarget(segments: string[]): string {
  if (!Array.isArray(segments) || segments.length === 0) {
    return 'Endpoint belum ditulis. Buka base URL jalur ini (tanpa /alias) untuk melihat daftar 150 alias.';
  }
  if (segments.some(s => hasPlaceholder(s))) {
    return 'URL masih menyisakan placeholder. Ganti {KEY} dengan key kamu dan {alias} dengan nama endpoint — contoh: gempa, am-verif-send, translate.';
  }
  if (segments.some(s => !s || s === '.' || s === '..' || s.includes('/') || s.includes('\\') || s.includes('\0'))) {
    return 'Path tidak sah.';
  }

  const rel = `/${segments.join('/')}`;
  const withoutApi = rel.startsWith('/api/') ? rel.slice('/api/'.length) : rel.slice(1);
  const namespace = withoutApi.split('/')[0];
  const slug = segments[segments.length - 1].toLowerCase();

  const saran = Object.keys(OPEN_ALIASES)
    .filter(a => a.toLowerCase().includes(slug) || slug.includes(a.toLowerCase()))
    .slice(0, 5);

  // Satu segmen = percobaan memakai alias pendek, bukan namespace.
  if (segments.length === 1) {
    const s = segments[0].toLowerCase();
    const isBlockedNs = BLOCKED_NAMESPACES.some(b => s === b || s.startsWith(`${b}-`) || s.startsWith(`${b}_`));
    if (isBlockedNs) {
      return `Namespace "${segments[0]}" tidak tersedia di jalur tanpa key. Namespace yang boleh: ${OPEN_NAMESPACES.join(', ')}.`;
    }
    return saran.length > 0
      ? `Alias "${segments[0]}" tidak dikenal. Mungkin maksud kamu: ${saran.join(', ')}.`
      : `Alias "${segments[0]}" tidak dikenal. Buka base URL jalur ini (tanpa /alias) untuk daftar ${OPEN_ALIAS_COUNT} alias.`;
  }

  if (namespace && !OPEN_NAMESPACES.includes(namespace)) {
    return `Namespace "${namespace}" tidak tersedia di jalur tanpa key. Namespace yang boleh: ${OPEN_NAMESPACES.join(', ')}.`;
  }

  if (saran.length > 0) {
    return `Endpoint "${rel}" tidak dikenal. Mungkin maksud kamu: ${saran.join(', ')}.`;
  }
  return `Endpoint "${rel}" tidak dikenal. Buka base URL jalur ini (tanpa /alias) untuk daftar ${OPEN_ALIAS_COUNT} alias.`;
}

export function buildOpenBaseUrl(origin: string, key: string): string {
  return `${origin.replace(/\/+$/, '')}${OPEN_PREFIX}/${key}`;
}

export function buildOpenShortBaseUrl(origin: string, key: string): string {
  return `${origin.replace(/\/+$/, '')}${OPEN_SHORT_PREFIX}/${key}`;
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
