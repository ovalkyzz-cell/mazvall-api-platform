import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

function nanoid(): string {
  return randomBytes(6).toString('base64url').slice(0, 12).toUpperCase();
}

export function generateApiKeyString(): string {
  return `MVAL-${nanoid()}`;
}

// ========== USERS ==========
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tier: true,
      createdAt: true,
      _count: { select: { apiKeys: true, usageLogs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUser(data: { email: string; password: string; name: string }) {
  return prisma.user.create({
    data: { email: data.email, name: data.name, password: data.password, role: 'user', tier: 'free' },
  });
}

export async function updateUser(id: string, data: { tier?: string; role?: string }) {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

// ========== API KEYS ==========
export async function findApiKeyByKey(key: string) {
  return prisma.apiKey.findUnique({ where: { key } });
}

export async function findApiKeyById(id: string) {
  return prisma.apiKey.findUnique({ where: { id } });
}

export async function getKeysByUserId(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    include: { _count: { select: { usageLogs: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllKeys() {
  return prisma.apiKey.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createApiKey(userId: string, name: string, rateLimit: number) {
  return prisma.apiKey.create({
    data: { key: generateApiKeyString(), name, userId, rateLimit },
  });
}

export async function toggleApiKey(id: string, active: boolean) {
  return prisma.apiKey.update({ where: { id }, data: { active } });
}

export async function deleteApiKey(id: string) {
  return prisma.apiKey.delete({ where: { id } });
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
  return prisma.usageLog.create({
    data: {
      apiKeyId: data.apiKeyId,
      userId: data.userId,
      endpoint: data.endpoint,
      method: data.method,
      status: data.status,
      responseTime: data.responseTime,
      ip: data.ip || null,
    },
  });
}

export async function getLogsByUserId(userId: string, limit = 100) {
  return prisma.usageLog.findMany({
    where: { userId },
    include: { apiKey: { select: { name: true, key: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function countLogsByUser(userId: string, since: Date) {
  return prisma.usageLog.count({ where: { userId, createdAt: { gte: since } } });
}

export async function getRecentLogs(limit = 20) {
  return prisma.usageLog.findMany({
    include: {
      user: { select: { name: true } },
      apiKey: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ========== TICKETS ==========
export async function getTicketsByUserId(userId: string) {
  return prisma.ticket.findMany({
    where: { userId },
    include: { _count: { select: { replies: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllTickets() {
  return prisma.ticket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      replies: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function createTicket(userId: string, data: { subject: string; message: string; category?: string; priority?: string }) {
  return prisma.ticket.create({
    data: {
      subject: data.subject,
      message: data.message,
      category: data.category || 'general',
      priority: data.priority || 'normal',
      userId,
    },
  });
}

export async function addTicketReply(ticketId: string, userId: string, message: string, isAdmin: boolean) {
  return prisma.ticketReply.create({
    data: { message, ticketId, userId, isAdmin },
  });
}

// ========== STATS ==========
export async function getAdminStats() {
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
}

export async function getDailyUsage(days: number) {
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
}

export async function getTierDistribution() {
  const users = await prisma.user.groupBy({ by: ['tier'], _count: true });
  return users.map((u) => ({ tier: u.tier, _count: u._count }));
}

// ========== RATE LIMITS ==========
export async function getRateLimits() {
  const configs = await prisma.rateLimitConfig.findMany();
  if (configs.length === 0) {
    return [
      { tier: 'free', rpm: 10, rph: 100, rpd: 1000 },
      { tier: 'developer', rpm: 60, rph: 2000, rpd: 20000 },
      { tier: 'enterprise', rpm: 300, rph: 10000, rpd: 100000 },
    ];
  }
  return configs.map((c) => ({ tier: c.tier, rpm: c.requestsPerMinute, rph: c.requestsPerHour, rpd: c.requestsPerDay }));
}

export async function updateRateLimitConfig(tier: string, rpm: number, rph: number, rpd: number) {
  return prisma.rateLimitConfig.upsert({
    where: { tier },
    update: { requestsPerMinute: rpm, requestsPerHour: rph, requestsPerDay: rpd },
    create: { tier, requestsPerMinute: rpm, requestsPerHour: rph, requestsPerDay: rpd },
  });
}

export async function countTodayLogsByKey(apiKeyId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return prisma.usageLog.count({ where: { apiKeyId, createdAt: { gte: today } } });
}
