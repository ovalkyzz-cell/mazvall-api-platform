import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/lib/db';
import { requireAdmin, authResponse, successResponse } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    const { tier, role, status } = await req.json();

    const validStatuses = ['active', 'pending', 'rejected', 'banned'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const user = await updateUser(params.id, { tier, role, status });
    return successResponse({ user }, 'User updated');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    await deleteUser(params.id);
    return successResponse(null, 'User deleted');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return authResponse('Unauthorized');
    if (error.message === 'Forbidden') return authResponse('Forbidden', 403);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
