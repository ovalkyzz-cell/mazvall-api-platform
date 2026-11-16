import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailable } from '@/lib/staticAuth';
import { normalizePlan } from '@/lib/planShape';

// daftar plan harus dibaca tiap request (jangan di-cache saat build)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
      // hanya field publik — kode diskon & kuota paket tidak ikut bocor
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        description: true,
        features: true,
        featureAccess: true,
        popular: true,
        active: true,
        requestsPerDay: true,
        requestsPerMin: true,
        requestsPerHour: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: plans.map(normalizePlan) });
  } catch (error) {
    console.error('Plans fetch error:', error);
    if (isDbUnavailable(error)) {
      // database mati → kirim daftar kosong agar halaman harga tetap terbuka
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
