import { NextRequest, NextResponse } from 'next/server';
import { mimoClient, MODEL_REGISTRY } from '@/lib/mimo';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/mimo/models' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    const models = await mimoClient.fetchModels();
    const grouped: Record<string, typeof MODEL_REGISTRY> = {};
    for (const m of models) {
      if (!grouped[m.provider]) grouped[m.provider] = [];
      grouped[m.provider].push(m);
    }

    const freeModels = models.filter(m => !m.premium);
    const premiumModels = models.filter(m => m.premium);

    await logApiUsage(auth.keyId, auth.user.userId, '/mimo/models', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      status: 'success',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: {
        total: models.length,
        free: freeModels.length,
        premium: premiumModels.length,
        providers: Object.keys(grouped).length,
        models,
        by_provider: grouped,
        free_models: freeModels.map(m => m.id),
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'success',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: {
        total: MODEL_REGISTRY.length,
        models: MODEL_REGISTRY,
        source: 'local_registry'
      }
    });
  }
}
