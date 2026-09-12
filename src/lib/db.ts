import { customAlphabet } from 'nanoid';
import bcrypt from 'bcryptjs';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12);

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  tier: 'free' | 'developer' | 'enterprise';
  createdAt: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  active: boolean;
  rateLimit: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  ip: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'normal' | 'high';
  category: string;
  userId: string;
  createdAt: string;
  replies: TicketReply[];
}

export interface TicketReply {
  id: string;
  message: string;
  userId: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Database {
  users: User[];
  apiKeys: ApiKey[];
  usageLogs: UsageLog[];
  tickets: Ticket[];
}

let db: Database | null = null;

function getDB(): Database {
  if (db) return db;
  db = getDefaultDB();
  return db;
}

function getDefaultDB(): Database {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'admin-001',
        email: 'admin@mazvall.com',
        name: 'Mazz-Vall Admin',
        password: '$2a$12$LJ3m4ys4Gz8nODhVCKTT0d1OnAfLTfGoiPsumKc4FnwKTatKL/B1b',
        role: 'admin',
        tier: 'enterprise',
        createdAt: now,
      },
      {
        id: 'demo-001',
        email: 'demo@mazvall.com',
        name: 'Demo User',
        password: '$2a$12$LJ3m4ys4Gz8nODhVCKTT0d1OnAfLTfGoiPsumKc4FnwKTatKL/B1b',
        role: 'user',
        tier: 'developer',
        createdAt: now,
      },
    ],
    apiKeys: [
      {
        id: 'key-001',
        key: 'MVAL-DEMO1234567890',
        name: 'Demo API Key',
        userId: 'demo-001',
        active: true,
        rateLimit: 60,
        lastUsedAt: null,
        createdAt: now,
      },
    ],
    usageLogs: [],
    tickets: [],
  };
}

// ========== USERS ==========
export function findUserByEmail(email: string): User | undefined {
  return getDB().users.find((u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return getDB().users.find((u) => u.id === id);
}

export function getAllUsers(): Omit<User, 'password'>[] {
  return getDB().users.map(({ password, ...u }) => u);
}

export function createUser(data: { email: string; password: string; name: string }): User {
  const db = getDB();
  const user: User = {
    id: `user-${nanoid()}`,
    email: data.email,
    name: data.name,
    password: data.password,
    role: 'user',
    tier: 'free',
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  return user;
}

export function updateUser(id: string, data: Partial<Pick<User, 'tier' | 'role'>>): User | null {
  const db = getDB();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  if (data.tier) user.tier = data.tier;
  if (data.role) user.role = data.role;
  return user;
}

export function deleteUser(id: string): boolean {
  const db = getDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  db.users.splice(idx, 1);
  db.apiKeys = db.apiKeys.filter((k) => k.userId !== id);
  db.usageLogs = db.usageLogs.filter((l) => l.userId !== id);
  return true;
}

// ========== API KEYS ==========
export function generateApiKeyString(): string {
  return `MVAL-${nanoid()}`;
}

export function findApiKeyByKey(key: string): ApiKey | undefined {
  return getDB().apiKeys.find((k) => k.key === key);
}

export function findApiKeyById(id: string): ApiKey | undefined {
  return getDB().apiKeys.find((k) => k.id === id);
}

export function getKeysByUserId(userId: string): ApiKey[] {
  return getDB().apiKeys.filter((k) => k.userId === userId);
}

export function getAllKeys(): ApiKey[] {
  return getDB().apiKeys;
}

export function createApiKey(userId: string, name: string, rateLimit: number): ApiKey {
  const db = getDB();
  const key: ApiKey = {
    id: `key-${nanoid()}`,
    key: generateApiKeyString(),
    name,
    userId,
    active: true,
    rateLimit,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
  };
  db.apiKeys.push(key);
  return key;
}

export function toggleApiKey(id: string, active: boolean): ApiKey | null {
  const key = getDB().apiKeys.find((k) => k.id === id);
  if (!key) return null;
  key.active = active;
  return key;
}

export function deleteApiKey(id: string): boolean {
  const db = getDB();
  const idx = db.apiKeys.findIndex((k) => k.id === id);
  if (idx === -1) return false;
  db.apiKeys.splice(idx, 1);
  return true;
}

// ========== USAGE LOGS ==========
export function createUsageLog(data: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  ip?: string;
}): UsageLog {
  const db = getDB();
  const log: UsageLog = {
    id: `log-${nanoid()}`,
    ...data,
    ip: data.ip || null,
    createdAt: new Date().toISOString(),
  };
  db.usageLogs.push(log);
  // keep last 1000 logs
  if (db.usageLogs.length > 1000) {
    db.usageLogs = db.usageLogs.slice(-1000);
  }
  return log;
}

export function getLogsByUserId(userId: string, limit = 100): UsageLog[] {
  return getDB()
    .usageLogs.filter((l) => l.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function countLogsByUser(userId: string, since: Date): number {
  return getDB().usageLogs.filter((l) => l.userId === userId && new Date(l.createdAt) >= since).length;
}

export function getRecentLogs(limit = 20): (UsageLog & { userName?: string; keyName?: string })[] {
  const db = getDB();
  return db.usageLogs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((l) => {
      const user = db.users.find((u) => u.id === l.userId);
      const key = db.apiKeys.find((k) => k.id === l.apiKeyId);
      return { ...l, userName: user?.name, keyName: key?.name };
    });
}

// ========== TICKETS ==========
export function getTicketsByUserId(userId: string): Ticket[] {
  return getDB().tickets.filter((t) => t.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllTickets(): Ticket[] {
  return getDB().tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function findTicketById(id: string): Ticket | undefined {
  return getDB().tickets.find((t) => t.id === id);
}

export function createTicket(userId: string, data: { subject: string; message: string; category?: string; priority?: string }): Ticket {
  const db = getDB();
  const ticket: Ticket = {
    id: `ticket-${nanoid()}`,
    subject: data.subject,
    message: data.message,
    status: 'open',
    priority: (data.priority as any) || 'normal',
    category: data.category || 'general',
    userId,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  db.tickets.push(ticket);
  return ticket;
}

export function addTicketReply(ticketId: string, userId: string, message: string, isAdmin: boolean): TicketReply | null {
  const ticket = getDB().tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;
  const reply: TicketReply = {
    id: `reply-${nanoid()}`,
    message,
    userId,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  ticket.replies.push(reply);
  return reply;
}

// ========== STATS ==========
export function getAdminStats() {
  const db = getDB();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    totalUsers: db.users.length,
    totalKeys: db.apiKeys.length,
    totalRequests: db.usageLogs.length,
    todayRequests: db.usageLogs.filter((l) => new Date(l.createdAt) >= today).length,
    activeKeys: db.apiKeys.filter((k) => k.active).length,
  };
}

export function getDailyUsage(days: number): { date: string; requests: number }[] {
  const db = getDB();
  const result: { date: string; requests: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = db.usageLogs.filter((l) => {
      const d = new Date(l.createdAt);
      return d >= dayStart && d < dayEnd;
    }).length;
    result.push({ date: dayStart.toISOString().split('T')[0], requests: count });
  }
  return result;
}

export function getTierDistribution(): { tier: string; count: number }[] {
  const db = getDB();
  const map = new Map<string, number>();
  db.users.forEach((u) => map.set(u.tier, (map.get(u.tier) || 0) + 1));
  return Array.from(map.entries()).map(([tier, count]) => ({ tier, count }));
}

// ========== RATE LIMITS ==========
export function getRateLimits(): { tier: string; rpm: number; rph: number; rpd: number }[] {
  return [
    { tier: 'free', rpm: 10, rph: 100, rpd: 1000 },
    { tier: 'developer', rpm: 60, rph: 2000, rpd: 20000 },
    { tier: 'enterprise', rpm: 300, rph: 10000, rpd: 100000 },
  ];
}
