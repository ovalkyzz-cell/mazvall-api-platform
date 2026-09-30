import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';
import { buildOpenBaseUrl, ensureOpenKey, rotateOpenKey, OPEN_KEY_NAME, OPEN_NAMESPACES, OPEN_RATE_LIMITS } from '@/lib/openAccess';

async function payload(req: NextRequest, adminUserId: string, key: { id: string; key: string; createdAt: Date }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [todayUsage, totalUsage, lastUsed] = await Promise.all([
    prisma.usageLog.count({ where: { apiKeyId: key.id, createdAt: { gte: today } } }),
    prisma.usageLog.count({ where: { apiKeyId: key.id } }),
    prisma.apiKey.findUnique({ where: { id: key.id }, select: { lastUsedAt: true } }),
  ]);

  return {
    baseUrl: buildOpenBaseUrl(req.nextUrl.origin, key.key),
    sampleUrl: `${buildOpenBaseUrl(req.nextUrl.origin, key.key)}/api/info/gempa`,
    keyId: key.id,
    createdAt: key.createdAt,
    lastUsedAt: lastUsed?.lastUsedAt || null,
    rateLimit: OPEN_RATE_LIMITS,
    namespaces: OPEN_NAMESPACES,
    usage: { today: todayUsage, total: totalUsage },
    owner: adminUserId,
    note: 'URL ini memang dirahasiakan. Hanya admin yang boleh mengetahuinya dan memutuskan kepada siapa dibagikan.',
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const key = await ensureOpenKey(admin.userId);
    return successResponse(await payload(req, admin.userId, key));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (body?.action !== 'rotate') {
      return NextResponse.json({ success: false, error: 'Action harus "rotate"' }, { status: 400 });
    }

    const key = await rotateOpenKey(admin.userId);
    const data = await payload(req, admin.userId, key);
    return successResponse(data, `${OPEN_KEY_NAME}: key berhasil diganti, key lama langsung mati`);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
