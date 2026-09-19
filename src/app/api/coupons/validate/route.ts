import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/auth";
import { validateCoupon, calculateDiscount } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, planId } = body;

    if (!code || !planId) {
      return successResponse(null, "code dan planId wajib diisi");
    }

    const result = await validateCoupon(code, planId);
    if (!result.valid) {
      return successResponse({ valid: false, error: result.error });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return successResponse({ valid: false, error: "Plan tidak ditemukan" });
    }

    const { finalPrice, discountAmount } = calculateDiscount(
      plan.price,
      result.coupon!.discountType,
      result.coupon!.discountValue
    );

    return successResponse({
      valid: true,
      code: result.coupon!.code,
      discountType: result.coupon!.discountType,
      discountValue: result.coupon!.discountValue,
      originalPrice: plan.price,
      discountAmount,
      finalPrice,
    });
  } catch (error: any) {
    return successResponse(null, "Gagal memvalidasi coupon");
  }
}
