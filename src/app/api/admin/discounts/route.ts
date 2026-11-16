import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authResponse, errorResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDiscount, generateDiscountCode } from "@/lib/discount";
import { staticAdminProfile } from "@/lib/staticAuth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    const fallbackCreator = staticAdminProfile();
    const data = discounts.map((d: any) => ({
      ...d,
      creator: d.creator ?? {
        name: fallbackCreator.name || "Admin",
        email: fallbackCreator.email || "-",
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const body = await req.json().catch(() => ({}));

    const percentage = Number(body.percentage ?? 10);
    if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
      return errorResponse("percentage harus berupa angka 1-100", 400);
    }

    const maxUses = Number(body.maxUses ?? 100);
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      return errorResponse("maxUses minimal 1", 400);
    }

    let validUntil: Date | undefined;
    if (body.validUntil) {
      const parsed = new Date(body.validUntil);
      if (Number.isNaN(parsed.getTime())) {
        return errorResponse("validUntil bukan tanggal valid", 400);
      }
      validUntil = parsed;
    }

    const discount = await createDiscount({
      description: body.description,
      percentage,
      maxUses,
      validUntil,
      createdBy: admin.userId,
    });

    return NextResponse.json({ success: true, data: discount }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (!id) {
      return errorResponse("Discount ID is required", 400);
    }

    // whitelist field — mencegah manipulasi usedCount/createdBy/code lewat PATCH
    const ALLOWED = ["active", "description", "percentage", "maxUses", "validUntil"];
    const updateData: Record<string, any> = {};

    if (body.percentage !== undefined) {
      const percentage = Number(body.percentage);
      if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
        return errorResponse("percentage harus berupa angka 1-100", 400);
      }
      updateData.percentage = percentage;
    }

    if (body.maxUses !== undefined) {
      const maxUses = Number(body.maxUses);
      if (!Number.isFinite(maxUses) || maxUses < 1) {
        return errorResponse("maxUses minimal 1", 400);
      }
      updateData.maxUses = Math.round(maxUses);
    }

    if (body.validUntil !== undefined) {
      if (body.validUntil === null || body.validUntil === "") {
        updateData.validUntil = null;
      } else {
        const parsed = new Date(body.validUntil);
        if (Number.isNaN(parsed.getTime())) {
          return errorResponse("validUntil bukan tanggal valid", 400);
        }
        updateData.validUntil = parsed;
      }
    }

    if (body.description !== undefined) {
      updateData.description = String(body.description);
    }

    if (body.active !== undefined) {
      updateData.active = !!body.active;
    }

    const unknownKeys = Object.keys(body).filter(
      (key) => key !== "id" && !ALLOWED.includes(key)
    );
    if (unknownKeys.length) {
      return errorResponse(`Field tidak diizinkan: ${unknownKeys.join(", ")}`, 400);
    }

    if (!Object.keys(updateData).length) {
      return errorResponse("Tidak ada field yang bisa diubah", 400);
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: discount });
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    await prisma.discount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Discount deleted" });
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
