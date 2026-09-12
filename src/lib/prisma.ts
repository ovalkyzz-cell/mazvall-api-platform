import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
});
globalForPrisma.prisma = prisma;

export const JWT_SECRET = process.env.JWT_SECRET || 'mazvall-fallback-secret';
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api-mazval.zone.id';

export const generateApiKey = (): string => {
  const id = randomBytes(6).toString('base64url').slice(0, 12).toUpperCase();
  return `MVAL-${id}`;
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signToken = (payload: { userId: string; email: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string; email: string; role: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const getTierLimits = (tier: string) => {
  const limits: Record<string, { rpm: number; rph: number; rpd: number }> = {
    free: { rpm: 10, rph: 100, rpd: 1000 },
    developer: { rpm: 60, rph: 2000, rpd: 20000 },
    enterprise: { rpm: 300, rph: 10000, rpd: 100000 },
  };
  return limits[tier] || limits.free;
};
