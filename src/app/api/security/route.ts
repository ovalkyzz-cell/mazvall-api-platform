import { NextRequest, NextResponse } from 'next/server';
import { getSecuritySettings } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const settings = await getSecuritySettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
