import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { isDbUnavailable } from '@/lib/staticAuth';

function nanoid(): string {
  return randomBytes(6).toString('base64url').slice(0, 12).toUpperCase();
}

export function generateApiKeyString(): string {
  return `MVAL-${nanoid()}`;
}

// ---------------------------------------------------------------------------
// Kegagalan database (Neon mati / putus) tidak boleh membuat seluruh panel
// mati: pembacaan jatuh ke nilai kosong, penulisan jatuh ke null (pemanggil
// mengirim pesan 503 yang ramah). Diperingatkan satu kali per operasi.
// ---------------------------------------------------------------------------
const warnedLabels = new Set<string>();

function warnOnce(label: string, err: unknown): void {
  if (warnedLabels.has(label)) return;
  warnedLabels.add(label);
  const cause = isDbUnavailable(err) ? 'database tidak terjangkau' : 'galat database';
  console.error(`[db] ${label} gagal (${cause}):`, (err as any)?.message || err);
}

async function safeRead<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    // galat logika (P2002 unik, P2025 tidak ada) harus tetap sampai ke pemanggil
    if (!isDbUnavailable(err)) throw err;
    warnOnce(label, err);
    return fallback;
  }
}

async function safeWrite<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (err) {
    if (!isDbUnavailable(err)) throw err;
    warnOnce(label, err);
    return null;
  }
}

// ========== USERS ==========
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getAllUsers() {
  return safeRead(
    'getAllUsers',
    () =>
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tier: true,
          status: true,
          createdAt: true,
          _count: { select: { apiKeys: true, usageLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    []
  );
}

export async function createUser(data: { email: string; password: string; name: string }) {
  return safeWrite('createUser', () =>
    prisma.user.create({
      data: { email: data.email, name: data.name, password: data.password, role: 'user', tier: 'free' },
    })
  );
}

export async function updateUser(id: string, data: { tier?: string; role?: string; status?: string }) {
  return safeWrite('updateUser', () => prisma.user.update({ where: { id }, data }));
}

export async function deleteUser(id: string) {
  return safeWrite('deleteUser', () => prisma.user.delete({ where: { id } }));
}

// ========== API KEYS ==========
export async function findApiKeyByKey(key: string) {
  return prisma.apiKey.findUnique({ where: { key } });
}

export async function findApiKeyById(id: string) {
  return prisma.apiKey.findUnique({ where: { id } });
}

export async function getKeysByUserId(userId: string) {
  return safeRead(
    'getKeysByUserId',
    () =>
      prisma.apiKey.findMany({
        where: { userId },
        include: { _count: { select: { usageLogs: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    []
  );
}

export async function getAllKeys() {
  return safeRead(
    'getAllKeys',
    () =>
      prisma.apiKey.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    []
  );
}

export async function createApiKey(userId: string, name: string, rateLimit: number) {
  return safeWrite('createApiKey', () =>
    prisma.apiKey.create({
      data: { key: generateApiKeyString(), name, userId, rateLimit },
    })
  );
}

export async function toggleApiKey(id: string, active: boolean) {
  return safeWrite('toggleApiKey', () => prisma.apiKey.update({ where: { id }, data: { active } }));
}

export async function deleteApiKey(id: string) {
  return safeWrite('deleteApiKey', () => prisma.apiKey.delete({ where: { id } }));
}

// ========== USAGE LOGS ==========
export async function createUsageLog(data: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  ip?: string;
}) {
  return safeWrite('createUsageLog', () =>
    prisma.usageLog.create({
      data: {
        apiKeyId: data.apiKeyId,
        userId: data.userId,
        endpoint: data.endpoint,
        method: data.method,
        status: data.status,
        responseTime: data.responseTime,
        ip: data.ip || null,
      },
    })
  );
}

export async function getLogsByUserId(userId: string, limit = 100) {
  return safeRead(
    'getLogsByUserId',
    () =>
      prisma.usageLog.findMany({
        where: { userId },
        include: { apiKey: { select: { name: true, key: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    []
  );
}

export async function countLogsByUser(userId: string, since: Date) {
  return safeRead(
    'countLogsByUser',
    () => prisma.usageLog.count({ where: { userId, createdAt: { gte: since } } }),
    0
  );
}

export async function getRecentLogs(limit = 20) {
  return safeRead(
    'getRecentLogs',
    () =>
      prisma.usageLog.findMany({
        include: {
          user: { select: { name: true } },
          apiKey: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    []
  );
}

// ========== TICKETS ==========
export async function getTicketsByUserId(userId: string) {
  return safeRead(
    'getTicketsByUserId',
    () =>
      prisma.ticket.findMany({
        where: { userId },
        include: { _count: { select: { replies: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    []
  );
}

export async function getAllTickets() {
  return safeRead(
    'getAllTickets',
    () =>
      prisma.ticket.findMany({
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    []
  );
}

export async function findTicketById(id: string) {
  return safeRead(
    'findTicketById',
    () =>
      prisma.ticket.findUnique({
        where: { id },
        include: {
          replies: {
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    null
  );
}

export async function createTicket(userId: string, data: { subject: string; message: string; category?: string; priority?: string }) {
  return safeWrite('createTicket', () =>
    prisma.ticket.create({
      data: {
        subject: data.subject,
        message: data.message,
        category: data.category || 'general',
        priority: data.priority || 'normal',
        userId,
      },
    })
  );
}

export async function addTicketReply(ticketId: string, userId: string, message: string, isAdmin: boolean) {
  return safeWrite('addTicketReply', () =>
    prisma.ticketReply.create({
      data: { message, ticketId, userId, isAdmin },
    })
  );
}

// ========== STATS ==========
export async function getAdminStats() {
  return safeRead(
    'getAdminStats',
    async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [totalUsers, totalKeys, totalRequests, todayRequests, activeKeys] = await Promise.all([
        prisma.user.count(),
        prisma.apiKey.count(),
        prisma.usageLog.count(),
        prisma.usageLog.count({ where: { createdAt: { gte: today } } }),
        prisma.apiKey.count({ where: { active: true } }),
      ]);

      return { totalUsers, totalKeys, totalRequests, todayRequests, activeKeys };
    },
    { totalUsers: 0, totalKeys: 0, totalRequests: 0, todayRequests: 0, activeKeys: 0 }
  );
}

export async function getDailyUsage(days: number) {
  return safeRead(
    'getDailyUsage',
    async () => {
      const result: { date: string; requests: number }[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const count = await prisma.usageLog.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
        });
        result.push({ date: dayStart.toISOString().split('T')[0], requests: count });
      }
      return result;
    },
    [] as { date: string; requests: number }[]
  );
}

export async function getTierDistribution() {
  return safeRead(
    'getTierDistribution',
    async () => {
      const users = await prisma.user.groupBy({ by: ['tier'], _count: true });
      return users.map((u) => ({ tier: u.tier, _count: u._count }));
    },
    [] as { tier: string; _count: number }[]
  );
}

// ========== RATE LIMITS ==========
const DEFAULT_RATE_LIMITS = [
  { tier: 'free', rpm: 10, rph: 100, rpd: 1000 },
  { tier: 'developer', rpm: 60, rph: 2000, rpd: 20000 },
  { tier: 'enterprise', rpm: 300, rph: 10000, rpd: 100000 },
];

export async function getRateLimits() {
  return safeRead(
    'getRateLimits',
    async () => {
      const configs = await prisma.rateLimitConfig.findMany();
      if (configs.length === 0) {
        return DEFAULT_RATE_LIMITS;
      }
      return configs.map((c) => ({ tier: c.tier, rpm: c.requestsPerMinute, rph: c.requestsPerHour, rpd: c.requestsPerDay }));
    },
    DEFAULT_RATE_LIMITS
  );
}

export async function updateRateLimitConfig(tier: string, rpm: number, rph: number, rpd: number) {
  return safeWrite('updateRateLimitConfig', () =>
    prisma.rateLimitConfig.upsert({
      where: { tier },
      update: { requestsPerMinute: rpm, requestsPerHour: rph, requestsPerDay: rpd },
      create: { tier, requestsPerMinute: rpm, requestsPerHour: rph, requestsPerDay: rpd },
    })
  );
}

export async function countTodayLogsByKey(apiKeyId: string) {
  return safeRead(
    'countTodayLogsByKey',
    async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return prisma.usageLog.count({ where: { apiKeyId, createdAt: { gte: today } } });
    },
    0
  );
}

// ========== SYSTEM CONFIG ==========
export async function getSystemConfig(key: string): Promise<string | null> {
  return safeRead(
    'getSystemConfig',
    async () => {
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      return config?.value || null;
    },
    null
  );
}

export async function setSystemConfig(key: string, value: string) {
  return safeWrite('setSystemConfig', () =>
    prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  );
}

const SECURITY_DEFAULTS: Record<string, string> = {
  botProtection: 'true',
  rateLimiting: 'true',
  ddosProtection: 'true',
  ipBlocklist: '',
  allowlist: '',
  maxRequestsPerSecond: '10',
};

export async function getSecuritySettings() {
  return safeRead(
    'getSecuritySettings',
    async () => {
      const keys = Object.keys(SECURITY_DEFAULTS);
      const configs = await prisma.systemConfig.findMany({
        where: { key: { in: keys } },
      });

      const result: Record<string, string> = { ...SECURITY_DEFAULTS };
      for (const c of configs) {
        result[c.key] = c.value;
      }
      return result;
    },
    { ...SECURITY_DEFAULTS }
  );
}

export async function updateSecuritySettings(settings: Record<string, string>) {
  return safeWrite('updateSecuritySettings', async () => {
    const operations = Object.entries(settings).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );
    return prisma.$transaction(operations);
  });
}

// ========== REVENUE / OMZET ==========
const EMPTY_REVENUE_STATS = {
  total: 0,
  today: 0,
  thisMonth: 0,
  thisYear: 0,
  totalTransactions: 0,
  todayTransactions: 0,
  monthTransactions: 0,
  yearTransactions: 0,
};

export async function getRevenueStats() {
  return safeRead(
    'getRevenueStats',
    async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      const paidStatuses = ['paid', 'success'];

      const [totalRevenue, todayRevenue, monthRevenue, yearRevenue, totalTransactions, todayTransactions, monthTransactions, yearTransactions] = await Promise.all([
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: { in: paidStatuses } } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: { in: paidStatuses }, paidAt: { gte: today } } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: { in: paidStatuses }, paidAt: { gte: thisMonth } } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: { in: paidStatuses }, paidAt: { gte: thisYear } } }),
        prisma.transaction.count({ where: { status: { in: paidStatuses } } }),
        prisma.transaction.count({ where: { status: { in: paidStatuses }, paidAt: { gte: today } } }),
        prisma.transaction.count({ where: { status: { in: paidStatuses }, paidAt: { gte: thisMonth } } }),
        prisma.transaction.count({ where: { status: { in: paidStatuses }, paidAt: { gte: thisYear } } }),
      ]);

      return {
        total: totalRevenue._sum.amount || 0,
        today: todayRevenue._sum.amount || 0,
        thisMonth: monthRevenue._sum.amount || 0,
        thisYear: yearRevenue._sum.amount || 0,
        totalTransactions,
        todayTransactions,
        monthTransactions,
        yearTransactions,
      };
    },
    { ...EMPTY_REVENUE_STATS }
  );
}

export async function getRevenueByPlan() {
  return safeRead(
    'getRevenueByPlan',
    async () => {
      const paidStatuses = ['paid', 'success'];

      const result = await prisma.transaction.groupBy({
        by: ['planId'],
        _sum: { amount: true },
        _count: true,
        where: { status: { in: paidStatuses } },
      });

      const plans = await prisma.plan.findMany({
        select: { id: true, name: true, price: true },
      });

      const planMap = new Map(plans.map(p => [p.id, p]));

      return result.map(r => ({
        planId: r.planId,
        planName: planMap.get(r.planId)?.name || 'Unknown',
        price: planMap.get(r.planId)?.price || 0,
        totalRevenue: r._sum.amount || 0,
        totalSales: r._count,
      }));
    },
    [] as { planId: string; planName: string; price: number; totalRevenue: number; totalSales: number }[]
  );
}

export async function getDailyRevenue(days: number) {
  return safeRead(
    'getDailyRevenue',
    async () => {
      const paidStatuses = ['paid', 'success'];
      const result: { date: string; revenue: number; transactions: number }[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const agg = await prisma.transaction.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { status: { in: paidStatuses }, paidAt: { gte: dayStart, lt: dayEnd } },
        });

        result.push({
          date: dayStart.toISOString().split('T')[0],
          revenue: agg._sum.amount || 0,
          transactions: agg._count,
        });
      }
      return result;
    },
    [] as { date: string; revenue: number; transactions: number }[]
  );
}

export async function getRecentTransactions(limit = 20) {
  return safeRead(
    'getRecentTransactions',
    () =>
      prisma.transaction.findMany({
        where: { status: { in: ['paid', 'success'] } },
        include: {
          user: { select: { name: true, email: true } },
          plan: { select: { name: true, price: true } },
        },
        orderBy: { paidAt: 'desc' },
        take: limit,
      }),
    []
  );
}

export async function getMonthlyRevenue(year: number) {
  return safeRead(
    'getMonthlyRevenue',
    async () => {
      const paidStatuses = ['paid', 'success'];
      const result: { month: string; revenue: number; transactions: number }[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 0, 23, 59, 59);

        const agg = await prisma.transaction.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { status: { in: paidStatuses }, paidAt: { gte: monthStart, lte: monthEnd } },
        });

        result.push({
          month: months[m],
          revenue: agg._sum.amount || 0,
          transactions: agg._count,
        });
      }
      return result;
    },
    [] as { month: string; revenue: number; transactions: number }[]
  );
}
