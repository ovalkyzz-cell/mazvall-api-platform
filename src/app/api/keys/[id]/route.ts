import { NextRequest, NextResponse } from 'next/server';
import { findApiKeyById, deleteApiKey, toggleApiKey } from '@/lib/db';
import { authenticate, authResponse, successResponse } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const key = findApiKeyById(params.id);
    if (!key || key.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    deleteApiKey(params.id);
    return successResponse(null, 'API key deleted');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return authResponse('Unauthorized');

    const key = findApiKeyById(params.id);
    if (!key || key.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    const { active } = await req.json();
    const updated = toggleApiKey(params.id, active);

    return successResponse({ apiKey: updated }, 'API key updated');
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
