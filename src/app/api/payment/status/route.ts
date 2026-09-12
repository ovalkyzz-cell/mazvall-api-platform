import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKeyString } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'transactionId query parameter is required' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: { transactionId, userId: decoded.userId },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const QRIS_ACCOUNT_ID = process.env.QRIS_ACCOUNT_ID || '';
    const QRIS_SECRET_TOKEN = process.env.QRIS_SECRET_TOKEN || '';
    const QRIS_BASE_URL = process.env.QRIS_BASE_URL || 'https://api.buatqris.site';

    const formData = new URLSearchParams();
    formData.append('action', 'api_check_status');
    formData.append('account_id', QRIS_ACCOUNT_ID);
    formData.append('secret_token', QRIS_SECRET_TOKEN);
    formData.append('transaction_id', transactionId);

    const response = await fetch(QRIS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to check payment status' },
        { status: 502 }
      );
    }

    const status = data.data?.status || data.status;

    if (status === 'success' && transaction.status !== 'success') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'success', paidAt: new Date() },
      });

      const plan = await prisma.plan.findUnique({ where: { id: transaction.planId } });
      if (plan) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await prisma.user.update({
          where: { id: decoded.userId },
          data: {
            planId: transaction.planId,
            planExpiry: expiryDate,
            tier: plan.name,
          },
        });

        const existingKey = await prisma.apiKey.findFirst({
          where: { userId: decoded.userId, active: true },
        });

        if (!existingKey) {
          const limits: Record<string, number> = { free: 10, developer: 60, enterprise: 300 };
          const rateLimit = limits[plan.name] || 100;

          await prisma.apiKey.create({
            data: {
              key: generateApiKeyString(),
              name: 'Default API Key',
              userId: decoded.userId,
              rateLimit,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: status || transaction.status,
        qrUrl: data.data?.qr_url || transaction.qrUrl,
        paymentUrl: data.data?.payment_url || transaction.paymentUrl,
      },
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
