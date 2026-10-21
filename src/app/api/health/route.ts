import { NextResponse } from 'next/server';
import { pingStateStorage } from '@/lib/stateStore';

export async function GET() {
  try {
    const ping = await pingStateStorage();
    if (!ping.ok) {
      return NextResponse.json(
        { status: 'error', storage: 'state-file', error: ping.error || 'state storage tidak terjangkau' },
        { status: 500 }
      );
    }
    return NextResponse.json({ status: 'ok', storage: 'state-file', source: ping.source });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', storage: 'state-file', error: error?.message },
      { status: 500 }
    );
  }
}
