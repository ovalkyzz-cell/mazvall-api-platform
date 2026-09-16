import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse } from "@/lib/auth";

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
    return successResponse(null, "Gagal mengambil data plans");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { name, slug, price, requestsPerDay, requestsPerMin, requestsPerHour, description, features, featureAccess, popular } = body;

    if (!name || !slug || !price || !description) {
      return successResponse(null, "name, slug, price, dan description wajib diisi");
    }

    const existingPlan = await prisma.plan.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existingPlan) {
      return successResponse(null, "Nama atau slug sudah digunakan");
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
    return successResponse(null, "Gagal membuat plan");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const body = await req.json();
    const { id, name, slug, price, requestsPerDay, requestsPerMin, requestsPerHour, description, features, featureAccess, popular, active, discountCode, discountType, discountValue, discountMaxUses, discountExpiresAt } = body;

    if (!id) {
      return successResponse(null, "Plan ID wajib diisi");
    }

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return successResponse(null, "Plan tidak ditemukan");
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
        return successResponse(null, "Nama atau slug sudah digunakan");
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
    return successResponse(null, "Gagal memperbarui plan");
  }
}
