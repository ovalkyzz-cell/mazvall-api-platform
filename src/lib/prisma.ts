import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();
globalForPrisma.prisma = prisma;

export const getTierLimits = (tier: string) => {
  const limits: Record<string, { rpm: number; rph: number; rpd: number }> = {
    free: { rpm: 30, rph: 200, rpd: 1000 },
    Gratis: { rpm: 30, rph: 200, rpd: 1000 },
    developer: { rpm: 60, rph: 2000, rpd: 20000 },
    enterprise: { rpm: 300, rph: 10000, rpd: 100000 },
  };
  return limits[tier] || limits.free;
};
