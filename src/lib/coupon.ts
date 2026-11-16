import { prisma } from "./prisma";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PREFIX = "DISCON-MVAL-";
const CODE_LENGTH = 5;

export function generateCouponCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return `${PREFIX}${code}`;
}

export async function generateUniqueCouponCode(): Promise<string> {
  let code: string;
  let exists: boolean;
  do {
    code = generateCouponCode();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    exists = !!existing;
  } while (exists);
  return code;
}

export async function validateCoupon(code: string, planId: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { plan: true },
  });

  if (coupon) {
    if (!coupon.active) {
      return { valid: false, error: "Kode diskon sudah tidak aktif" };
    }

    if (coupon.planId && coupon.planId !== planId) {
      return { valid: false, error: "Kode diskon tidak berlaku untuk paket ini" };
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { valid: false, error: "Kode diskon sudah kedaluwarsa" };
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: "Kode diskon sudah mencapai batas penggunaan" };
    }

    return { valid: true, coupon, kind: "coupon" as const };
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (plan && plan.discountCode && plan.discountCode === code) {
    if (!plan.active) {
      return { valid: false, error: "Paket ini sudah tidak aktif" };
    }

    if (plan.discountExpiresAt && new Date() > plan.discountExpiresAt) {
      return { valid: false, error: "Kode diskon paket sudah kedaluwarsa" };
    }

    if (plan.discountMaxUses && plan.discountUsedCount >= plan.discountMaxUses) {
      return { valid: false, error: "Kode diskon paket sudah mencapai batas penggunaan" };
    }

    return {
      valid: true,
      kind: "plan" as const,
      coupon: {
        id: plan.id,
        code: plan.discountCode,
        planId: plan.id,
        discountType: plan.discountType || "percentage",
        discountValue: plan.discountValue || 0,
        maxUses: plan.discountMaxUses || 999999,
        usedCount: plan.discountUsedCount,
        active: true,
        expiresAt: plan.discountExpiresAt,
        plan,
      } as any,
    };
  }

  // tidak ada kupon maupun kode diskon paket → penanda agar resolver
  // lanjut mengecek diskon global (tabel discount)
  return { valid: false, error: "Kode diskon tidak ditemukan", notFound: true };
}

export function calculateDiscount(
  price: number,
  discountType: string,
  discountValue: number
): { finalPrice: number; discountAmount: number } {
  let discountAmount = 0;

  if (discountType === "percentage") {
    discountAmount = Math.floor((price * discountValue) / 100);
  } else {
    discountAmount = discountValue;
  }

  const finalPrice = Math.max(0, price - discountAmount);

  return { finalPrice, discountAmount };
}
