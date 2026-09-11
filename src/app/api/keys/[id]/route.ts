import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const key = await prisma.apiKey.findFirst({
      where: { id: params.id, userId: user.userId },
    });

    if (!key) return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });

    await prisma.apiKey.delete({ where: { id: params.id } });

    return successResponse(null, 'API key deleted');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const { active } = await req.json();

    const key = await prisma.apiKey.findFirst({
      where: { id: params.id, userId: user.userId },
    });

    if (!key) return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });

    const updated = await prisma.apiKey.update({
      where: { id: params.id },
      data: { active },
    });

    return successResponse({ apiKey: updated }, 'API key updated');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
