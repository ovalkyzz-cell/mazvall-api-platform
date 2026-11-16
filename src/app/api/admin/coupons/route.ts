import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse, errorResponse } from "@/lib/auth";
import { isDbUnavailable } from "@/lib/staticAuth";
import { generateUniqueCouponCode } from "@/lib/coupon";
import { normalizePlan } from "@/lib/planShape";

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

    return successResponse(
      coupons.map((c: any) => ({ ...c, plan: c.plan ? normalizePlan(c.plan) : null }))
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    if (isDbUnavailable(error)) return errorResponse("Database sedang tidak aktif", 503);
    return errorResponse("Gagal mengambil data coupon", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { planId, discountType, discountValue, maxUses, expiresAt } = body;

    if (!discountType || !discountValue) {
      return errorResponse("discountType dan discountValue wajib diisi", 400);
    }

    if (planId && planId !== "all") {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return errorResponse("Plan tidak ditemukan", 404);
      }
    }

    const code = await generateUniqueCouponCode();

    const coupon = await prisma.coupon.create({
      data: {
        code,
        planId: planId && planId !== "all" ? planId : null,
        discountType,
        discountValue: parseInt(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { plan: { select: { name: true, slug: true, price: true } } },
    });

    return successResponse(coupon, "Coupon berhasil dibuat");
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    if (isDbUnavailable(error)) return errorResponse("Database sedang tidak aktif — coupon gagal disimpan.", 503);
    return errorResponse("Gagal membuat coupon", 500);
  }
}
