import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { validateCoupon, calculateDiscount } from '@/lib/coupon';

const JWT_SECRET = process.env.JWT_SECRET || 'mazvall-fallback-secret';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return req.cookies.get('mazvall_token')?.value || null;
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, couponCode } = body;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'planId is required' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ success: false, error: 'Plan not found or inactive' }, { status: 404 });
    }

    let finalPrice = plan.price;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, planId);
      if (!couponResult.valid) {
        return NextResponse.json(
          { success: false, error: couponResult.error },
          { status: 400 }
        );
      }

      const discount = calculateDiscount(
        plan.price,
        couponResult.coupon!.discountType,
        couponResult.coupon!.discountValue
      );
      finalPrice = discount.finalPrice;
      discountAmount = discount.discountAmount;
      appliedCoupon = couponResult.coupon;
    } else if (plan.discountCode && plan.discountValue) {
      const discount = calculateDiscount(
        plan.price,
        plan.discountType || 'percentage',
        plan.discountValue
      );
      finalPrice = discount.finalPrice;
      discountAmount = discount.discountAmount;
    }

    const QRIS_ACCOUNT_ID = process.env.QRIS_ACCOUNT_ID || '';
    const QRIS_SECRET_TOKEN = process.env.QRIS_SECRET_TOKEN || '';
    const QRIS_BASE_URL = process.env.QRIS_BASE_URL || 'https://api.buatqris.site';

    const formData = new URLSearchParams();
    formData.append('action', 'api_create_qris');
    formData.append('account_id', QRIS_ACCOUNT_ID);
    formData.append('secret_token', QRIS_SECRET_TOKEN);
    formData.append('amount', finalPrice.toString());
    formData.append('description', `Pembayaran ${plan.name}${discountAmount > 0 ? ` (Diskon Rp ${discountAmount.toLocaleString('id-ID')})` : ''}`);

    const response = await fetch(QRIS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to create QRIS payment' },
        { status: 502 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: decoded.userId,
        planId: plan.id,
        amount: finalPrice,
        transactionId: data.data?.transaction_id || null,
        qrUrl: data.data?.qr_url || null,
        paymentUrl: data.data?.payment_url || null,
        status: 'pending',
      },
    });

    if (appliedCoupon) {
      if (appliedCoupon.id !== plan.id) {
        await prisma.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      } else {
        await prisma.plan.update({
          where: { id: plan.id },
          data: { discountUsedCount: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.transactionId || transaction.id,
        qrUrl: transaction.qrUrl,
        paymentUrl: transaction.paymentUrl,
        amount: transaction.amount,
        originalPrice: plan.price,
        discountAmount,
        finalPrice,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
