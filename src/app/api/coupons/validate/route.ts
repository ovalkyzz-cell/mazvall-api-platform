import { NextRequest } from "next/server";
import { requireAuth, authResponse, successResponse } from "@/lib/auth";
import { validateCoupon, calculateDiscount } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!user) return authResponse("Unauthorized");

    const body = await req.json();
    const { code, planId } = body;

    if (!code || !planId) {
      return successResponse(null, "code dan planId wajib diisi");
    }

    const result = await validateCoupon(code, planId);
    if (!result.valid) {
      return successResponse({ valid: false, error: result.error });
    }

    const { finalPrice, discountAmount } = calculateDiscount(
      result.coupon!.plan.price,
      result.coupon!.discountType,
      result.coupon!.discountValue
    );

    return successResponse({
      valid: true,
      code: result.coupon!.code,
      discountType: result.coupon!.discountType,
      discountValue: result.coupon!.discountValue,
      originalPrice: result.coupon!.plan.price,
      discountAmount,
      finalPrice,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    return successResponse(null, "Gagal memvalidasi coupon");
  }
}
