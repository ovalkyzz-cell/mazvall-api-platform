import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const BLOCKED_BOTS = [
  'semrush',
  'ahrefs',
  'mj12bot',
  'dotbot',
  'blexbot',
  'zoominfobot',
  'gptbot',
  'ccbot',
  'anthropic',
  'claudebot',
  'scrapy',
  'python-requests',
  'go-http-client',
];

function isBlockedBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BLOCKED_BOTS.some(bot => ua.includes(bot));
}

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string, maxRequests: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  if (isBlockedBot(userAgent)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
    const key = getRateLimitKey(request);
    if (!checkRateLimit(key, 100)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
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
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/).*)'],
};
