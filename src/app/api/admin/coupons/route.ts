import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse } from "@/lib/auth";
import { generateUniqueCouponCode } from "@/lib/coupon";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");

    const where: any = {};
    if (planId) where.planId = planId;

    const coupons = await prisma.coupon.findMany({
      where,
      include: { plan: { select: { name: true, slug: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(coupons);
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return successResponse(null, "Gagal mengambil data coupon");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { planId, discountType, discountValue, maxUses, expiresAt } = body;

    if (!planId || !discountType || !discountValue) {
      return successResponse(null, "planId, discountType, dan discountValue wajib diisi");
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return successResponse(null, "Plan tidak ditemukan");
    }

    const code = await generateUniqueCouponCode();

    const coupon = await prisma.coupon.create({
      data: {
        code,
        planId,
        discountType,
        discountValue: parseInt(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { plan: { select: { name: true } } },
    });

    return successResponse(coupon, "Coupon berhasil dibuat");
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return successResponse(null, "Gagal membuat coupon");
  }
}
