import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOpenRateLimit, isOpenKeyFormat, resolveOpenTarget } from '@/lib/openAccess';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
};

type RouteHandler = (req: NextRequest, ctx?: { params?: any }) => Response | Promise<Response>;

type RouteModule = Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD', RouteHandler>>;

// Respons 404 disamakan untuk semua keadaan gagal (key salah, key nonaktif,
// namespace di luar daftar) supaya jalur rahasia ini tidak bisa dipindai.
function notFound() {
  return NextResponse.json(
    { success: false, error: 'Endpoint tidak ditemukan' },
    { status: 404, headers: CORS_HEADERS }
  );
}

function withCors(res: Response): Response {
  try {
    Object.entries(CORS_HEADERS).forEach(([name, value]) => res.headers.set(name, value));
  } catch {
    return res;
  }
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Next 14 tidak mendukung NextResponse.rewrite() di dalam route handler,
// jadi target /api/... dipanggil langsung di proses yang sama.
async function loadRoute(target: string): Promise<RouteModule | null> {
  try {
    const rest = target.slice('/api'.length);
    return (await import(/* webpackMode: "lazy" */ `../../../api${rest}/route`)) as RouteModule;
  } catch {
    return null;
  }
}

async function dispatch(req: NextRequest, target: string, key: string): Promise<Response> {
  const mod = await loadRoute(target);
  if (!mod) return notFound();

  const method = req.method.toUpperCase();
  const handler = mod[method as keyof RouteModule];
  if (!handler) return notFound();

  const url = new URL(target, req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, name) => {
    if (name !== 'apikey') url.searchParams.set(name, value);
  });

  const headers = new Headers(req.headers);
  headers.set('x-api-key', key);
  headers.delete('authorization');
  headers.delete('content-length');

  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const targetReq = new NextRequest(url, { method, headers, body });
  const res = await handler(targetReq, { params: {} });
  return withCors(res);
}

async function handle(req: NextRequest, { params }: { params: { key: string; path: string[] } }) {
  try {
    const key = params.key || '';
    if (!isOpenKeyFormat(key)) return notFound();

    const target = resolveOpenTarget(params.path || []);
    if (!target) return notFound();

    const record = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: { select: { status: true } } },
    });
    if (!record || !record.active || record.user.status !== 'active') return notFound();

    const rate = await checkOpenRateLimit(record.id);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batas rate limit tercapai',
          data: { limit: rate.limit, remaining: rate.remaining },
        },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(rate.retryAfter) } }
      );
    }

    return await dispatch(req, target, key);
  } catch (error: any) {
    console.error('[open] gagal', {
      target: resolveOpenTarget(params?.path || []),
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 6).join('\n'),
    });
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
