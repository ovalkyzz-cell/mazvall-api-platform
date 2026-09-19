import { NextRequest, NextResponse } from 'next/server';
import { mimoClient } from '@/lib/mimo';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/mimo/chat' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, messages, model } = body;

    if (!prompt && (!messages || messages.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Field "prompt" atau "messages" wajib diisi',
        endpoint: '/mimo/chat'
      }, { status: 400 });
    }

    const result = await mimoClient.sendMessage({ prompt, messages, model });

    await logApiUsage(auth.keyId, auth.user.userId, '/mimo/chat', 'POST', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      status: 'success',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: {
        response: result.response,
        model: result.model,
        usage: {
          prompt_tokens: prompt ? prompt.length : 0,
          completion_tokens: result.response.length,
          total_tokens: (prompt ? prompt.length : 0) + result.response.length
        }
      }
    });
  } catch (error: any) {
    const statusCode = error?.response?.status || 500;
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memproses permintaan',
      endpoint: '/mimo/chat'
    }, { status: 500 });
  }
}
