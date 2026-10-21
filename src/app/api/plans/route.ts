import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailable } from '@/lib/staticAuth';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({ success: true, data: plans });
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
