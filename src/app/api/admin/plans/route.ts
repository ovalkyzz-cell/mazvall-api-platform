import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authResponse, successResponse, errorResponse } from "@/lib/auth";
import { isDbUnavailable } from "@/lib/staticAuth";
import { normalizePlan } from "@/lib/planShape";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return authResponse("Unauthorized");

    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    return successResponse(plans.map(normalizePlan));
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

const toInt = (value: unknown): number => parseInt(String(value ?? ""), 10);

function invalidNumber(message: string) {
  return errorResponse(message, 400);
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

    const priceInt = toInt(price);
    const dayInt = requestsPerDay === undefined || requestsPerDay === null || requestsPerDay === "" ? 100 : toInt(requestsPerDay);
    const minInt = requestsPerMin === undefined || requestsPerMin === null || requestsPerMin === "" ? 10 : toInt(requestsPerMin);
    const hourInt = requestsPerHour === undefined || requestsPerHour === null || requestsPerHour === "" ? 500 : toInt(requestsPerHour);

    if (!Number.isFinite(priceInt) || priceInt < 0) return invalidNumber("price harus berupa angka nol atau lebih");
    if (!Number.isFinite(dayInt) || dayInt < 0) return invalidNumber("requestsPerDay harus berupa angka nol atau lebih");
    if (!Number.isFinite(minInt) || minInt < 0) return invalidNumber("requestsPerMin harus berupa angka nol atau lebih");
    if (!Number.isFinite(hourInt) || hourInt < 0) return invalidNumber("requestsPerHour harus berupa angka nol atau lebih");

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
        price: priceInt,
        requestsPerDay: dayInt,
        requestsPerMin: minInt,
        requestsPerHour: hourInt,
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

    const nullableNumeric = new Set(["discountValue", "discountMaxUses"]);
    const numericFields: Array<[string, any]> = [
      ["price", price],
      ["requestsPerDay", requestsPerDay],
      ["requestsPerMin", requestsPerMin],
      ["requestsPerHour", requestsPerHour],
      ["discountValue", discountValue],
      ["discountMaxUses", discountMaxUses],
    ];
    for (const [field, raw] of numericFields) {
      if (raw === undefined) continue;
      if (raw === null || raw === "") {
        if (nullableNumeric.has(field)) {
          updateData[field] = null;
        } else {
          return invalidNumber(`${field} harus berupa angka nol atau lebih`);
        }
        continue;
      }
      const parsed = toInt(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return invalidNumber(`${field} harus berupa angka nol atau lebih`);
      }
      updateData[field] = parsed;
    }
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = features;
    if (featureAccess !== undefined) updateData.featureAccess = featureAccess;
    if (popular !== undefined) updateData.popular = popular;
    if (active !== undefined) updateData.active = active;
    if (discountCode !== undefined) updateData.discountCode = discountCode || null;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountExpiresAt !== undefined) {
      if (discountExpiresAt) {
        const parsedExpiry = new Date(discountExpiresAt);
        if (Number.isNaN(parsedExpiry.getTime())) {
          return errorResponse("discountExpiresAt bukan tanggal valid", 400);
        }
        updateData.discountExpiresAt = parsedExpiry;
      } else {
        updateData.discountExpiresAt = null;
      }
    }

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
