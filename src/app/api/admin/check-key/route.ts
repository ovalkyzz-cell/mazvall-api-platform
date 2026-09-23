import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const key = req.nextUrl.searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Parameter key diperlukan' }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          key,
          found: false,
          status: 'inactive',
          message: 'Key sudah tidak aktif',
        },
      });
    }

    const isActive = apiKey.active && apiKey.user.status === 'active';
    const isExpired = apiKey.expiresAt ? new Date(apiKey.expiresAt) < new Date() : false;

    let statusText = '';
    if (!apiKey.active) {
      statusText = 'Key sudah tidak aktif (revoked)';
    } else if (isExpired) {
      statusText = 'Key sudah tidak aktif (expired)';
    } else if (apiKey.user.status !== 'active') {
      statusText = `Key sudah tidak aktif (user ${apiKey.user.status})`;
    } else {
      statusText = 'Key masih aktif';
    }

    const usageToday = await prisma.usageLog.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

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
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt,
          usageToday,
          user: {
            name: apiKey.user.name,
            email: apiKey.user.email,
            role: apiKey.user.role,
            tier: apiKey.user.tier,
            status: apiKey.user.status,
          },
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
