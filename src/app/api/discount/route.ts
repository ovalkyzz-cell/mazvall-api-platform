import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";
import { resolveDiscountCode } from "@/lib/discount";
import { isDbUnavailable } from "@/lib/staticAuth";

/**
 * Validasi kode diskon global/paket/kupon.
 * Body: { code, planId?, price? } — planId dipakai untuk ikat kupon ke paket
 * dan mengambil harga dasar bila price tidak dikirim.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, planId, price } = body;

    if (!code) {
      return errorResponse("Kode diskon harus diisi", 400);
    }

    let resolvedPrice: number;
    if (price !== undefined && price !== null && String(price).trim() !== '') {
      resolvedPrice = Math.max(0, Number(price) || 0);
    } else if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      resolvedPrice = plan ? Math.max(0, plan.price) : 0;
    } else {
      resolvedPrice = 0;
    }

    const result = await resolveDiscountCode(code, planId, resolvedPrice);
    if (!result.valid) {
      return errorResponse(result.error, 400);
    }

    return successResponse({
      id: result.discountId || result.couponId || result.planId,
      code: result.code,
      kind: result.kind,
      percentage: result.discountType === "percentage" ? result.discountValue : null,
      discountType: result.discountType,
      discountValue: result.discountValue,
      originalPrice: result.originalPrice,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      description: result.description ?? null,
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return errorResponse(
        "Database sedang tidak aktif — diskon tidak dapat divalidasi. Coba lagi nanti.",
        503
      );
    }
    console.error("Validate discount error:", error);
    return errorResponse("Internal server error", 500);
  }
}
