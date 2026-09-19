import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse } from "@/lib/auth";
import { generateUniqueCouponCode } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { planId, discountType, discountValue, maxUses, expiresAt, count } = body;

    if (!discountType || !discountValue || !count) {
      return successResponse(null, "discountType, discountValue, dan count wajib diisi");
    }

    const qty = parseInt(count);
    if (qty < 1 || qty > 100) {
      return successResponse(null, "Jumlah coupon harus antara 1-100");
    }

    if (planId && planId !== "all") {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return successResponse(null, "Plan tidak ditemukan");
      }
    }

    const coupons = [];
    for (let i = 0; i < qty; i++) {
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
      });
      coupons.push(coupon);
    }

    return successResponse(coupons, `${qty} coupon berhasil dibuat`);
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return successResponse(null, "Gagal membuat coupon");
  }
}
