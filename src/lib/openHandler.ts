import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/apikey';
import {
  OPEN_KEY_NAME,
  OPEN_NAMESPACES,
  OPEN_RATE_LIMITS,
  checkOpenRateLimit,
  explainOpenTarget,
  findOpenKey,
  hasPlaceholder,
  isOpenKeyFormat,
  resolveOpenTarget,
} from '@/lib/openAccess';
import { OPEN_ALIASES, OPEN_ALIAS_COUNT, OPEN_METHODS } from '@/lib/openAliases';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
};

type RouteHandler = (req: NextRequest, ctx?: { params?: any }) => Response | Promise<Response>;

type RouteModule = Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD', RouteHandler>>;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...CORS_HEADERS, ...headers } });
}

// Dipakai untuk key salah/tidak dikenal: pesan disamakan supaya jalur ini tidak bisa dipindai.
function notFound() {
  return json({ success: false, error: 'Endpoint tidak ditemukan' }, 404);
}

function withCors(res: Response): Response {
  try {
    Object.entries(CORS_HEADERS).forEach(([name, value]) => res.headers.set(name, value));
  } catch {
    return res;
  }
  return res;
}

export function openOptions() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function authorize(rawKey: string) {
  if (!rawKey || hasPlaceholder(rawKey) || !isOpenKeyFormat(rawKey)) return null;
  const record = await findOpenKey(rawKey);
  if (!record || !record.active || record.user.status !== 'active') return null;
  return record;
}

// Next 14 tidak mendukung NextResponse.rewrite() di dalam route handler,
// jadi target /api/... dipanggil langsung di proses yang sama.
async function loadRoute(target: string): Promise<RouteModule | null> {
  try {
    const rest = target.slice('/api'.length);
    return (await import(/* webpackMode: "lazy" */ `../app/api${rest}/route`)) as RouteModule;
  } catch {
    return null;
  }
}

async function dispatch(req: NextRequest, target: string, key: string): Promise<Response> {
  const mod = await loadRoute(target);
  if (!mod) {
    return json({ success: false, error: 'Endpoint tidak ditemukan' }, 404);
  }

  const method = req.method.toUpperCase();
  const handler = mod[method as keyof RouteModule];
  if (!handler) {
    const supported = Object.keys(mod).filter(k => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(k));
    return json(
      {
        success: false,
        error: `Method ${method} tidak didukung endpoint ini`,
        detail: supported.length ? `Pakai method: ${supported.join(', ')}` : 'Endpoint ini tidak menerima request.',
      },
      405
    );
  }

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

async function applyRateLimit(record: NonNullable<Awaited<ReturnType<typeof authorize>>>) {
  const isOpenKey = record.name === OPEN_KEY_NAME;

  if (isOpenKey) {
    const rate = await checkOpenRateLimit(record.id);
    return {
      allowed: rate.allowed,
      retryAfter: rate.retryAfter,
      body: { limit: rate.limit, remaining: rate.remaining },
      scope: 'jalur tanpa key',
    };
  }

  const rate = await checkRateLimit(record.id, record.userId, record.user.role);
  return {
    allowed: rate.allowed,
    retryAfter: 60,
    body: { limit: rate.limit, remaining: rate.remaining },
    scope: 'key',
  };
}

export async function openHandler(req: NextRequest, { params }: { params: { key: string; path: string[] } }) {
  try {
    const rawKey = params.key || '';
    const segments = params.path || [];

    if (hasPlaceholder(rawKey)) {
      return json(
        {
          success: false,
          error: 'Endpoint tidak ditemukan',
          detail: 'URL masih berisi placeholder {KEY}. Ganti dengan key kamu, contoh: /o/LNJxxxx/gempa',
        },
        404
      );
    }

    const record = await authorize(rawKey);
    if (!record) return notFound();

    const target = resolveOpenTarget(segments);
    if (!target) {
      return json({ success: false, error: 'Endpoint tidak ditemukan', detail: explainOpenTarget(segments) }, 404);
    }

    const rate = await applyRateLimit(record);
    if (!rate.allowed) {
      return json(
        {
          success: false,
          error: 'Batas rate limit tercapai',
          data: rate.body,
        },
        429,
        { 'Retry-After': String(rate.retryAfter) }
      );
    }

    return await dispatch(req, target, record.key);
  } catch (error: any) {
    console.error('[open] gagal', {
      target: resolveOpenTarget(params?.path || []),
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 6).join('\n'),
    });
    return json({ success: false, error: 'Terjadi kesalahan server' }, 500);
  }
}

function buildCatalog(rawKey: string, origin: string) {
  const endpoints = Object.entries(OPEN_ALIASES).map(([alias, path]) => ({
    alias,
    path,
    methods: OPEN_METHODS[alias] || ['GET'],
    url: `${origin}/o/${rawKey}/${alias}`,
  }));

  return {
    success: true,
    baseUrl: `${origin}/o/${rawKey}`,
    longBaseUrl: `${origin}/open/${rawKey}`,
    key: rawKey,
    aliasCount: OPEN_ALIAS_COUNT,
    namespaces: OPEN_NAMESPACES,
    rateLimit: OPEN_RATE_LIMITS,
    note: 'Cara pakai: {baseUrl}/{alias}?param=... — ganti {alias} dengan salah satu dari daftar di bawah. Path penuh (/api/tools/...) juga tetap diterima.',
    endpoints,
  };
}

function renderIndexHtml(catalog: ReturnType<typeof buildCatalog>): string {
  const groups = new Map<string, typeof catalog.endpoints>();
  for (const item of catalog.endpoints) {
    const ns = item.path.split('/')[2];
    if (!groups.has(ns)) groups.set(ns, []);
    groups.get(ns)!.push(item);
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const sections = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ns, items]) => `
      <section>
        <h2>${esc(ns)} <span>${items.length}</span></h2>
        <ul>
          ${items.map(i => `<li><a href="${esc(i.url)}"><code>${esc(i.alias)}</code></a><span class="m">${i.methods.join(' · ')}</span></li>`).join('')}
        </ul>
      </section>`)
    .join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Daftar Alias Endpoint</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a14;color:#e7e7f3;font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
  header{padding:28px 20px 18px;border-bottom:1px solid #1d1d2e}
  h1{margin:0 0 6px;font-size:19px;letter-spacing:.4px}
  p{margin:4px 0;color:#8a8aa3;font-size:13px}
  .box{background:#101020;border:1px solid #23233a;border-radius:8px;padding:10px 12px;margin-top:12px;word-break:break-all;color:#7ef0d5}
  main{padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#ff5fb0;margin:0 0 8px}
  h2 span{color:#4b4b66;font-weight:400;letter-spacing:0}
  ul{list-style:none;margin:0;padding:0;background:#0d0d1a;border:1px solid #1c1c30;border-radius:8px}
  li{display:flex;justify-content:space-between;gap:8px;padding:7px 10px;border-bottom:1px solid #16162a}
  li:last-child{border-bottom:0}
  a{color:#7cf7ff;text-decoration:none}
  a:hover{text-decoration:underline}
  .m{color:#55556f;font-size:11px;white-space:nowrap}
  footer{padding:18px 20px;color:#55556f;font-size:12px;border-top:1px solid #1d1d2e}
</style>
</head>
<body>
<header>
  <h1>Daftar ${catalog.aliasCount} Alias Endpoint (jalur tanpa key)</h1>
  <p>Klik alias untuk memanggilnya. Tambahkan parameter sesuai kebutuhan.</p>
  <div class="box">${esc(catalog.baseUrl)}/{alias}</div>
  <p>Path penuh juga tetap diterima, contoh: ${esc(catalog.baseUrl)}/api/info/gempa</p>
</header>
<main>${sections}</main>
<footer>Rate limit: ${catalog.rateLimit.rpm}/menit · ${catalog.rateLimit.rph.toLocaleString()}/jam · ${catalog.rateLimit.rpd.toLocaleString()}/hari per IP. Jangan bagikan halaman ini ke sembarang orang.</footer>
</body>
</html>`;
}

// GET /o/{key}  atau  /open/{key}  -> daftar alias (HTML untuk browser, JSON untuk API client)
export async function openIndex(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const rawKey = params.key || '';
    const record = await authorize(rawKey);
    if (!record) return notFound();

    const catalog = buildCatalog(rawKey, req.nextUrl.origin);
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      return new NextResponse(renderIndexHtml(catalog), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return json(catalog, 200, { 'Cache-Control': 'no-store' });
  } catch (error: any) {
    console.error('[open-index] gagal', error?.message);
    return json({ success: false, error: 'Terjadi kesalahan server' }, 500);
  }
}
