import { NextRequest } from 'next/server';
import { findUserById } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';
import { isDbUnavailable, matchesStaticAdminEmail, staticAdminProfile } from '@/lib/staticAuth';

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    let dbUser: any = null;
    let dbDown = false;

    try {
      dbUser = await findUserById(user.userId);
    } catch (err) {
      if (!isDbUnavailable(err)) return authResponse('Unauthorized');
      dbDown = true;
      console.error('Auth me: database tidak terjangkau:', (err as any)?.message || err);
    }

    if (dbUser) {
      const { password, ...safe } = dbUser;
      return successResponse({ user: safe });
    }

    if (!dbDown) return authResponse('User not found');

    // Database mati: pertahankan sesi dari klaim JWT supaya pengguna tidak
    // langsung keluar — admin statis mendapat profil lengkap.
    if (user.userId === 'static-admin' || matchesStaticAdminEmail(user.email)) {
      const { ...safe } = staticAdminProfile();
      return successResponse({ user: safe });
    }

    return successResponse({
      user: {
        id: user.userId,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role,
        tier: user.tier || 'free',
        status: user.status || 'active',
        planId: null,
      },
    });
  } catch {
    return authResponse('Unauthorized');
  }
}
