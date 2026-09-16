import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDiscount, generateDiscountCode } from "@/lib/discount";

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

    return NextResponse.json({ success: true, data: discounts });
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
    const body = await req.json();

    const discount = await createDiscount({
      description: body.description,
      percentage: body.percentage,
      maxUses: body.maxUses,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      createdBy: admin.id,
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
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
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
