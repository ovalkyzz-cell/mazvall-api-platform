import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";
import { resolveDiscountCode } from "@/lib/discount";
import { isDbUnavailable } from "@/lib/staticAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, planId } = body;

    if (!code || !planId) {
      return errorResponse("code dan planId wajib diisi", 400);
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return successResponse({ valid: false, error: "Plan tidak ditemukan" });
    }

    const result = await resolveDiscountCode(code, planId, plan.price);
    if (!result.valid) {
      return successResponse({ valid: false, error: result.error });
    }

    return successResponse({
      valid: true,
      code: result.code,
      kind: result.kind,
      discountType: result.discountType,
      discountValue: result.discountValue,
      originalPrice: result.originalPrice,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return errorResponse(
        "Database sedang tidak aktif — kupon tidak dapat divalidasi. Coba lagi nanti.",
        503
      );
    }
    console.error("Validate coupon error:", error);
    return errorResponse("Gagal memvalidasi coupon", 500);
  }
}
