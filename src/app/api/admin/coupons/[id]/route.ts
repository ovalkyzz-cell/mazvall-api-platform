import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse, errorResponse } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const { id } = params;
    const body = await req.json().catch(() => ({}));

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return errorResponse("Coupon tidak ditemukan", 404);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        active: body.active !== undefined ? body.active : coupon.active,
        maxUses: body.maxUses ? parseInt(body.maxUses) : coupon.maxUses,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : coupon.expiresAt,
      },
      include: { plan: { select: { name: true } } },
    });

    return successResponse(updated, "Coupon berhasil diupdate");
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return errorResponse("Gagal mengupdate coupon", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const { id } = params;

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return errorResponse("Coupon tidak ditemukan", 404);
    }

    await prisma.coupon.delete({ where: { id } });

    return successResponse(null, "Coupon berhasil dihapus");
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return errorResponse("Gagal menghapus coupon", 500);
  }
}
