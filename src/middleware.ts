import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getClientIp,
  isIpBlocked,
  blockIp,
  trackSuspiciousActivity,
  checkSlidingWindow,
  checkTokenBucket,
  detectAttackPatterns,
  isValidRequest,
} from '@/lib/security';

const BLOCKED_BOTS = [
  'semrush', 'ahrefs', 'mj12bot', 'dotbot', 'blexbot', 'zoominfobot',
  'gptbot', 'ccbot', 'anthropic', 'claudebot', 'scrapy',
  'petalbot', 'bytespider', 'amazonbot', 'bingbot', 'yandexbot', 'sogou',
  'exabot', 'facebot', 'facebookexternalhit', 'ia_archiver', 'slurp',
  'baiduspider', 'duckduckbot', 'konqueror', 'larson crawler', 'psbot',
  'seekbot', 'sistrixCrawler', 'surveybot', 'tagbot', 'zibbot',
  'headlesschrome', 'phantomjs', 'puppeteer', 'selenium', 'playwright',
  'crawling', 'spider',
];

const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
  '/.env', '/.git', '/.htaccess', '/config.php', '/admin.php',
  '/xmlrpc.php', '/wp-cron.php', '/readme.html', '/license.txt',
  '/debug', '/test', '/backup', '/dump', '/phpmyadmin',
  '/server-status', '/server-info', '/.well-known',
  '/cgi-bin', '/scripts', '/includes', '/modules', '/templates',
];

const BLOCKED_EXTENSIONS = [
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py',
  '.bak', '.old', '.orig', '.save', '.swp', '.tmp',
  '.sql', '.mdb', '.db', '.sqlite',
];

const authRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isBlockedBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  if (!userAgent || ua.length < 5) return true;
  return BLOCKED_BOTS.some(bot => ua.includes(bot));
}

function isBlockedPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (BLOCKED_PATHS.some(path => lower.includes(path))) return true;
  if (BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext))) return true;
  return false;
}

function checkAuthRateLimit(ip: string, maxRequests: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = authRateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    authRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = getClientIp(request);

  if (isIpBlocked(ip)) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak.' },
      { status: 429 }
    );
  }

  const validation = isValidRequest(request);
  if (!validation.valid) {
    trackSuspiciousActivity(ip, 'invalid_user_agent');
    return NextResponse.json(
      { success: false, error: 'Request tidak valid.' },
      { status: 403 }
    );
  }

  if (isBlockedBot(userAgent)) {
    trackSuspiciousActivity(ip, 'blocked_bot');
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (isBlockedPath(pathname)) {
    trackSuspiciousActivity(ip, 'blocked_path');
    return NextResponse.json(
      { success: false, error: 'Akses ditolak.' },
      { status: 403 }
    );
  }

  const attacks = detectAttackPatterns(pathname);
  if (attacks.length > 0) {
    for (const attack of attacks) {
      trackSuspiciousActivity(ip, attack);
    }
    return NextResponse.json(
      { success: false, error: 'Request ditolak.' },
      { status: 403 }
    );
  }

  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const authRateCheck = checkAuthRateLimit(ip, pathname.includes('login') ? 5 : 3);
    if (!authRateCheck.allowed) {
      blockIp(ip, 15 * 60 * 1000, 'auth_rate_limit');
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak percobaan.' },
        { status: 429 }
      );
    }
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
    if (!checkSlidingWindow(ip)) {
      trackSuspiciousActivity(ip, 'rate_limit');
      return NextResponse.json(
        { success: false, error: 'Rate limit tercapai.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    if (!checkTokenBucket(ip)) {
      trackSuspiciousActivity(ip, 'rapid_requests');
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak request.' },
        { status: 429, headers: { 'Retry-After': '30' } }
      );
    }
  }

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('mazvall_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  const response = NextResponse.next();

  response.headers.set('X-Request-Id', crypto.randomUUID());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/).*)'],
};
