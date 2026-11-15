import { NextRequest, NextResponse } from 'next/server';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

const BASE = 'https://myinstants-api.vercel.app';

async function fetchMyInstants(path: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(15000) });
  } catch (error: any) {
    // jaringan/timeout ke upstream — bukan kesalahan server kita
    const err: any = new Error(error?.message || 'Upstream tidak merespons');
    err.upstream = true;
    throw err;
  }
  if (!res.ok) {
    const err: any = new Error(`Upstream membalas HTTP ${res.status}`);
    err.upstream = true;
    err.status = res.status;
    throw err;
  }
  try {
    return await res.json();
  } catch {
    const err: any = new Error('Upstream mengirim respons yang tidak valid');
    err.upstream = true;
    throw err;
  }
}

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
    const params = new URLSearchParams(req.nextUrl.searchParams);
    const action = params.get('action') || 'trending';
    const q = params.get('q');
    const id = params.get('id');
    const username = params.get('username');

    let data: any;

    switch (action) {
      case 'trending':
        data = await fetchMyInstants(`/trending?q=${q || 'id'}`);
        break;
      case 'search':
        if (!q) {
          return NextResponse.json({ success: false, error: 'Parameter q diperlukan untuk search' }, { status: 400 });
        }
        data = await fetchMyInstants(`/search?q=${encodeURIComponent(q)}`);
        break;
      case 'detail':
        if (!id) {
          return NextResponse.json({ success: false, error: 'Parameter id diperlukan untuk detail' }, { status: 400 });
        }
        data = await fetchMyInstants(`/detail?id=${encodeURIComponent(id)}`);
        break;
      case 'recent':
        data = await fetchMyInstants('/recent');
        break;
      case 'best':
        data = await fetchMyInstants(`/best?q=${q || 'id'}`);
        break;
      case 'uploaded':
        if (!username) {
          return NextResponse.json({ success: false, error: 'Parameter username diperlukan untuk uploaded' }, { status: 400 });
        }
        data = await fetchMyInstants(`/uploaded?username=${encodeURIComponent(username)}`);
        break;
      case 'favorites':
        if (!username) {
          return NextResponse.json({ success: false, error: 'Parameter username diperlukan untuk favorites' }, { status: 400 });
        }
        data = await fetchMyInstants(`/favorites?username=${encodeURIComponent(username)}`);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Action tidak valid',
          endpoint: '/api/tools/myinstants',
          available_actions: ['trending', 'search', 'detail', 'recent', 'best', 'uploaded', 'favorites'],
          examples: [
            '/api/tools/myinstants?action=trending&q=id',
            '/api/tools/myinstants?action=search&q=laugh',
            '/api/tools/myinstants?action=detail&id=akh-26815',
            '/api/tools/myinstants?action=recent',
            '/api/tools/myinstants?action=best&q=id',
            '/api/tools/myinstants?action=uploaded&username=hellmouz',
            '/api/tools/myinstants?action=favorites&username=hellmouz',
          ],
        }, { status: 400 });
    }

    await logApiUsage(auth.keyId, auth.user.userId, '/api/tools/myinstants', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/tools/myinstants',
      action,
      data,
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    // galat upstream: laporkan 502 dengan pesan ramah (dulu bocor jadi 500
    // "MyInstants API error: 503")
    if (error?.upstream) {
      return NextResponse.json({
        success: false,
        error: `Layanan MyInstants sedang tidak tersedia${error?.status ? ` (HTTP ${error.status})` : ''}. Silakan coba lagi nanti.`,
        endpoint: '/api/tools/myinstants',
      }, { status: 502 });
    }
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
