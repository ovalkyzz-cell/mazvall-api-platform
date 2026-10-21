import { NextRequest, NextResponse } from 'next/server';
import { getKeysByUserId, createApiKey, findUserById } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const keys = await getKeysByUserId(user.userId);
    return successResponse({ keys });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { name } = await req.json();
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });

    const limits: Record<string, number> = { free: 10, developer: 60, enterprise: 300 };
    let tier = user.tier || 'free';
    try {
      const dbUser = await findUserById(user.userId);
      if (dbUser) tier = dbUser.tier;
    } catch {
      // database mati — pakai tier dari klaim JWT
    }

    const apiKey = await createApiKey(user.userId, name, limits[tier] || 10);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Layanan penyimpanan API key sedang tidak aktif. Silakan coba lagi beberapa saat lagi.' },
        { status: 503 }
      );
    }
    return successResponse({ apiKey }, 'API key created');
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
