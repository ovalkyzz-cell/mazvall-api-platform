import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse, errorResponse } from "@/lib/auth";
import { isDbUnavailable } from "@/lib/staticAuth";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    return successResponse(plans);
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    if (isDbUnavailable(error)) {
      // database mati → daftar kosong agar halaman plans tetap terbuka
      return successResponse([]);
    }
    return errorResponse("Gagal mengambil data plans", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { name, slug, price, requestsPerDay, requestsPerMin, requestsPerHour, description, features, featureAccess, popular } = body;

    if (!name || !slug || !price || !description) {
      return errorResponse("name, slug, price, dan description wajib diisi", 400);
    }

    const existingPlan = await prisma.plan.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existingPlan) {
      return errorResponse("Nama atau slug sudah digunakan", 400);
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        price: parseInt(price),
        requestsPerDay: requestsPerDay ? parseInt(requestsPerDay) : 100,
        requestsPerMin: requestsPerMin ? parseInt(requestsPerMin) : 10,
        requestsPerHour: requestsPerHour ? parseInt(requestsPerHour) : 500,
        description,
        features: features || "",
        featureAccess: featureAccess || "all",
        popular: popular || false,
      },
    });

    return successResponse(plan, "Plan berhasil dibuat");
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    if (isDbUnavailable(error)) {
      return errorResponse("Database sedang tidak aktif — plan gagal disimpan. Coba lagi nanti.", 503);
    }
    return errorResponse("Gagal membuat plan", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { id, name, slug, price, requestsPerDay, requestsPerMin, requestsPerHour, description, features, featureAccess, popular, active, discountCode, discountType, discountValue, discountMaxUses, discountExpiresAt } = body;

    if (!id) {
      return errorResponse("Plan ID wajib diisi", 400);
    }

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return errorResponse("Plan tidak ditemukan", 404);
    }

    if (name || slug) {
      const orConditions: any[] = [];
      if (name) orConditions.push({ name });
      if (slug) orConditions.push({ slug });

      const duplicate = await prisma.plan.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { OR: orConditions },
          ],
        },
      });
      if (duplicate) {
        return errorResponse("Nama atau slug sudah digunakan", 400);
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (price !== undefined) updateData.price = parseInt(price);
    if (requestsPerDay !== undefined) updateData.requestsPerDay = parseInt(requestsPerDay);
    if (requestsPerMin !== undefined) updateData.requestsPerMin = parseInt(requestsPerMin);
    if (requestsPerHour !== undefined) updateData.requestsPerHour = parseInt(requestsPerHour);
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = features;
    if (featureAccess !== undefined) updateData.featureAccess = featureAccess;
    if (popular !== undefined) updateData.popular = popular;
    if (active !== undefined) updateData.active = active;
    if (discountCode !== undefined) updateData.discountCode = discountCode || null;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue ? parseInt(discountValue) : null;
    if (discountMaxUses !== undefined) updateData.discountMaxUses = discountMaxUses ? parseInt(discountMaxUses) : null;
    if (discountExpiresAt !== undefined) updateData.discountExpiresAt = discountExpiresAt ? new Date(discountExpiresAt) : null;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    return successResponse(plan, "Plan berhasil diperbarui");
  } catch (error: any) {
    if (error.message === "Unauthorized") return authResponse("Unauthorized");
    if (error.message === "Forbidden") return authResponse("Forbidden", 403);
    if (isDbUnavailable(error)) {
      return errorResponse("Database sedang tidak aktif — perubahan plan gagal disimpan. Coba lagi nanti.", 503);
    }
    return errorResponse("Gagal memperbarui plan", 500);
  }
}
