import { NextRequest, NextResponse } from "next/server";
import { validateDiscount } from "@/lib/discount";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Kode diskon harus diisi" },
        { status: 400 }
      );
    }

    const result = await validateDiscount(code.toUpperCase());

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.discount });
  } catch (error) {
    console.error("Validate discount error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
