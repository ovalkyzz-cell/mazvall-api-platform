import { prisma } from "./prisma";

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

  return prisma.discount.create({
    data: {
      code,
      description: data.description,
      percentage: data.percentage ?? 10,
      maxUses: data.maxUses ?? 100,
      validUntil: data.validUntil,
      createdBy: data.createdBy,
    },
  });
}

export async function validateDiscount(code: string) {
  const discount = await prisma.discount.findUnique({
    where: { code },
  });

  if (!discount) {
    return { valid: false, message: "Kode diskon tidak ditemukan" };
  }

  if (!discount.active) {
    return { valid: false, message: "Kode diskon tidak aktif" };
  }

  if (discount.usedCount >= discount.maxUses) {
    return { valid: false, message: "Kode diskon sudah habis digunakan" };
  }

  if (discount.validUntil && new Date() > discount.validUntil) {
    return { valid: false, message: "Kode diskon sudah kedaluwarsa" };
  }

  return {
    valid: true,
    discount: {
      id: discount.id,
      code: discount.code,
      percentage: discount.percentage,
      description: discount.description,
    },
  };
}

export async function applyDiscount(discountId: string) {
  return prisma.discount.update({
    where: { id: discountId },
    data: { usedCount: { increment: 1 } },
  });
}
