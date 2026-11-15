import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';
import { findStoredApiKey, isKeyExpired, staticAdminAuth } from '@/lib/apikey';
import { isDbUnavailable } from '@/lib/staticAuth';

function notFound(key: string, message: string) {
  return NextResponse.json({
    success: true,
    data: { key, found: false, status: 'inactive', message },
  });
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const key = (req.nextUrl.searchParams.get('key') || '').trim();

    if (!key) {
      return NextResponse.json({ success: false, error: 'Parameter key diperlukan' }, { status: 400 });
    }

    // Key statis admin tidak tersimpan di penyimpanan — tetap dilaporkan aktif
    // (dulu selalu "Key sudah tidak aktif" karena lookup database gagal).
    if (staticAdminAuth(key)) {
      const usageToday = await safeCount(key);
      return NextResponse.json({
        success: true,
        data: {
          key,
          found: true,
          status: 'active',
          message: 'Key masih aktif (key statis admin)',
          details: {
            name: 'Static Admin Key',
            rateLimit: 999999,
            active: true,
            expired: false,
            expiresAt: null,
            createdAt: null,
            lastUsedAt: null,
            usageToday,
            user: {
              name: 'Admin Mazvall',
              email: 'static-admin@localhost',
              role: 'admin',
              tier: 'admin',
              status: 'active',
            },
          },
        },
      });
    }

    const apiKey = await findStoredApiKey(key);

    if (!apiKey) {
      return notFound(key, 'Key sudah tidak aktif');
    }

    const owner = apiKey.user;
    const isExpired = isKeyExpired(apiKey);
    const isActive = !!apiKey.active && !!owner && owner.status === 'active' && !isExpired;

    let statusText = '';
    if (!apiKey.active) {
      statusText = 'Key sudah tidak aktif (revoked)';
    } else if (isExpired) {
      statusText = 'Key sudah tidak aktif (expired)';
    } else if (!owner) {
      statusText = 'Key sudah tidak aktif (pemilik key tidak ditemukan)';
    } else if (owner.status !== 'active') {
      statusText = `Key sudah tidak aktif (user ${owner.status})`;
    } else {
      statusText = 'Key masih aktif';
    }

    const usageToday = await safeCount(apiKey.id);

    return NextResponse.json({
      success: true,
      data: {
        key: apiKey.key,
        found: true,
        status: isActive ? 'active' : 'inactive',
        message: statusText,
        details: {
          name: apiKey.name,
          rateLimit: apiKey.rateLimit,
          active: apiKey.active,
          expired: isExpired,
          expiresAt: apiKey.expiresAt ?? null,
          createdAt: apiKey.createdAt ?? null,
          lastUsedAt: apiKey.lastUsedAt ?? null,
          usageToday,
          user: {
            name: owner?.name ?? '-',
            email: owner?.email ?? '-',
            role: owner?.role ?? '-',
            tier: owner?.tier ?? '-',
            status: owner?.status ?? 'missing',
          },
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    if (isDbUnavailable(error)) {
      return NextResponse.json(
        { success: false, error: 'Penyimpanan API sedang tidak terjangkau. Coba lagi beberapa saat lagi.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function safeCount(apiKeyId: string): Promise<number> {
  try {
    return await prisma.usageLog.count({
      where: { apiKeyId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
  } catch {
    return 0;
  }
}
