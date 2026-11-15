import { NextRequest, NextResponse } from 'next/server';
import { findApiKeyById, deleteApiKey, toggleApiKey } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';
import { isDbUnavailable } from '@/lib/staticAuth';

const storageDown = () =>
  NextResponse.json(
    { success: false, error: 'Penyimpanan API key sedang tidak terjangkau. Coba lagi beberapa saat lagi.' },
    { status: 503 }
  );

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const key = await findApiKeyById(params.id);
    if (!key || key.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    const deleted = await deleteApiKey(params.id);
    // deleteApiKey() membalikkan null saat penyimpanan mati — jangan berpura-pura
    // berhasil (dulu selalu membalas "API key deleted" padahal tidak tersimpan)
    if (!deleted) return storageDown();

    return successResponse(null, 'API key deleted');
  } catch (error: any) {
    if (isDbUnavailable(error)) return storageDown();
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const key = await findApiKeyById(params.id);
    if (!key || key.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({} as any));
    const active = Boolean(body?.active);
    const updated = await toggleApiKey(params.id, active);
    if (!updated) return storageDown();

    return successResponse({ apiKey: updated }, 'API key updated');
  } catch (error: any) {
    if (isDbUnavailable(error)) return storageDown();
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
