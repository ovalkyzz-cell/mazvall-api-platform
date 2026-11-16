import { prisma } from "./prisma";
import { validateCoupon, calculateDiscount } from "./coupon";

const DISCOUNT_PREFIX = "DISCON-MVAL-";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 5;

function generateRandomCode(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export function normalizeDiscountCode(code: unknown): string {
  return String(code ?? "").trim().toUpperCase();
}

export async function generateDiscountCode(): Promise<string> {
  let code: string;
  let exists = true;

  while (exists) {
    code = DISCOUNT_PREFIX + generateRandomCode(CODE_LENGTH);
    const existing = await prisma.discount.findUnique({
      where: { code },
    });
    exists = !!existing;
  }

  return code!;
}

export async function createDiscount(data: {
  description?: string;
  percentage?: number;
  maxUses?: number;
  validUntil?: Date;
  createdBy: string;
}) {
  const code = await generateDiscountCode();
  const percentage = Math.min(100, Math.max(1, Number(data.percentage) || 10));
  const maxUses = Math.max(1, Math.round(Number(data.maxUses) || 100));

  return prisma.discount.create({
    data: {
      code,
      description: data.description,
      percentage,
      maxUses,
      validUntil: data.validUntil,
      createdBy: data.createdBy,
    },
  });
}

export type ResolvedDiscount =
  | {
      valid: true;
      kind: "coupon" | "plan" | "global";
      code: string;
      discountType: string;
      discountValue: number;
      originalPrice: number;
      discountAmount: number;
      finalPrice: number;
      couponId: string | null;
      planId: string | null;
      discountId: string | null;
      description?: string | null;
    }
  | { valid: false; error: string };

/**
 * Resolver tunggal untuk tiga sumber diskon (dipakai /api/coupons/validate,
 * /api/discount, dan /api/payment/create) supaya aturan & pesan error sama:
 *   1. kupon (tabel coupon)
 *   2. kode diskon milik paket (plan.discountCode)
 *   3. diskon global (tabel discount, prefix DISCON-MVAL-)
 * Harga akhir selalu di-clamp >= 0.
 */
export async function resolveDiscountCode(
  code: unknown,
  planId?: string | null,
  price = 0
): Promise<ResolvedDiscount> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    return { valid: false, error: "Kode diskon harus diisi" };
  }

  const originalPrice = Math.max(0, Number(price) || 0);

  if (planId) {
    const couponResult = await validateCoupon(normalized, planId);

    if (couponResult.valid) {
      const coupon: any = couponResult.coupon;
      const discountType = coupon.discountType || "percentage";
      const discountValue = Number(coupon.discountValue) || 0;
      const { discountAmount, finalPrice } = calculateDiscount(
        originalPrice,
        discountType,
        discountValue
      );

      const kind = (couponResult as any).kind === "plan" ? "plan" : "coupon";
      return {
        valid: true,
        kind,
        code: normalized,
        discountType,
        discountValue,
        originalPrice,
        discountAmount,
        finalPrice,
        couponId: kind === "coupon" ? coupon.id : null,
        planId: kind === "plan" ? planId : null,
        discountId: null,
        description: coupon.description ?? null,
      };
    }

    // kupon/kode paket ada tapi tidak berlaku → jangan coba diskon global
    if (!(couponResult as any).notFound) {
      return { valid: false, error: couponResult.error || "Kode diskon tidak valid" };
    }
  }

  if (!planId) {
    // kupon tanpa ikatan paket tetap bisa divalidasi lewat /api/discount
    const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
    if (coupon) {
      if (!coupon.active) {
        return { valid: false, error: "Kode diskon sudah tidak aktif" };
      }
      if (coupon.planId) {
        return { valid: false, error: "Kode diskon ini hanya berlaku untuk paket tertentu" };
      }
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return { valid: false, error: "Kode diskon sudah kedaluwarsa" };
      }
      if (coupon.usedCount >= coupon.maxUses) {
        return { valid: false, error: "Kode diskon sudah mencapai batas penggunaan" };
      }

      const discountType = coupon.discountType || "percentage";
      const discountValue = Number(coupon.discountValue) || 0;
      const { discountAmount, finalPrice } = calculateDiscount(
        originalPrice,
        discountType,
        discountValue
      );

      return {
        valid: true,
        kind: "coupon" as const,
        code: normalized,
        discountType,
        discountValue,
        originalPrice,
        discountAmount,
        finalPrice,
        couponId: coupon.id,
        planId: null,
        discountId: null,
        description: coupon.description ?? null,
      };
    }
  }

  const discount = await prisma.discount.findUnique({ where: { code: normalized } });
  if (!discount) {
    return { valid: false, error: "Kode diskon tidak ditemukan" };
  }
  if (!discount.active) {
    return { valid: false, error: "Kode diskon tidak aktif" };
  }
  if (discount.validFrom && new Date() < new Date(discount.validFrom)) {
    return { valid: false, error: "Kode diskon belum berlaku" };
  }
  if (discount.validUntil && new Date() > new Date(discount.validUntil)) {
    return { valid: false, error: "Kode diskon sudah kedaluwarsa" };
  }
  // maxUses null/undefined = tanpa batas
  const maxUses =
    discount.maxUses === null || discount.maxUses === undefined
      ? Infinity
      : Number(discount.maxUses);
  if (Number(discount.usedCount || 0) >= maxUses) {
    return { valid: false, error: "Kode diskon sudah habis digunakan" };
  }

  const { discountAmount, finalPrice } = calculateDiscount(
    originalPrice,
    "percentage",
    Number(discount.percentage) || 0
  );

  return {
    valid: true,
    kind: "global",
    code: discount.code,
    discountType: "percentage",
    discountValue: Number(discount.percentage) || 0,
    originalPrice,
    discountAmount,
    finalPrice,
    couponId: null,
    planId: null,
    discountId: discount.id,
    description: discount.description ?? null,
  };
}

/**
 * Diskon otomatis milik paket (tanpa kode). Hanya berlaku bila paket aktif,
 * belum kedaluwarsa, dan kuota pemakaian masih tersedia.
 */
export function resolvePlanAutoDiscount(plan: any, price: number) {
  if (!plan || !plan.discountCode || !Number(plan.discountValue)) return null;
  if (plan.active === false) return null;
  if (plan.discountExpiresAt && new Date() > new Date(plan.discountExpiresAt)) return null;
  if (
    plan.discountMaxUses &&
    Number(plan.discountUsedCount || 0) >= Number(plan.discountMaxUses)
  ) {
    return null;
  }

  const originalPrice = Math.max(0, Number(price) || 0);
  const discountType = plan.discountType || "percentage";
  const discountValue = Number(plan.discountValue) || 0;
  const { discountAmount, finalPrice } = calculateDiscount(
    originalPrice,
    discountType,
    discountValue
  );

  return {
    kind: "plan" as const,
    code: plan.discountCode,
    discountType,
    discountValue,
    originalPrice,
    discountAmount,
    finalPrice,
    planId: plan.id,
  };
}
