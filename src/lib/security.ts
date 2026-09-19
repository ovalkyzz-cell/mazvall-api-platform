const blockedIps = new Map<string, { until: number; reason: string }>();
const suspiciousIps = new Map<string, { score: number; events: Array<{ type: string; time: number }> }>();
const requestFingerprints = new Map<string, { count: number; windowStart: number }>();
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

const IP_BLOCK_DURATION = 30 * 60 * 1000;
const SUSPICIOUS_THRESHOLD = 15;
const SLIDING_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 80;
const TOKEN_BUCKET_CAPACITY = 100;
const TOKEN_REFILL_RATE = 2;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  const ip = cfConnecting || forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip.replace(/[^0-9a-fA-F.:]/g, '');
}

export function isIpBlocked(ip: string): boolean {
  const entry = blockedIps.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    blockedIps.delete(ip);
    return false;
  }
  return true;
}

export function blockIp(ip: string, durationMs: number, reason: string): void {
  blockedIps.set(ip, { until: Date.now() + durationMs, reason });
}

export function trackSuspiciousActivity(ip: string, eventType: string): boolean {
  const now = Date.now();
  const entry = suspiciousIps.get(ip);

  if (!entry) {
    suspiciousIps.set(ip, { score: 1, events: [{ type: eventType, time: now }] });
    return false;
  }

  entry.events = entry.events.filter(e => now - e.time < 300000);
  entry.events.push({ type: eventType, time: now });

  const scoreIncrease = getScoreForEvent(eventType);
  entry.score += scoreIncrease;

  if (entry.score >= SUSPICIOUS_THRESHOLD) {
    blockIp(ip, IP_BLOCK_DURATION, `Suspicious activity: ${eventType}`);
    suspiciousIps.delete(ip);
    return true;
  }

  return false;
}

function getScoreForEvent(eventType: string): number {
  const scores: Record<string, number> = {
    'blocked_bot': 3,
    'blocked_path': 5,
    'rate_limit': 2,
    'auth_fail': 2,
    'invalid_user_agent': 4,
    'path_traversal': 10,
    'xss_attempt': 10,
    'sql_injection': 10,
    'suspicious_header': 3,
    'invalid_accept': 2,
    'rapid_requests': 1,
    'scraping_pattern': 4,
  };
  return scores[eventType] || 1;
}

export function checkSlidingWindow(ip: string): boolean {
  const now = Date.now();
  const entry = requestFingerprints.get(ip);

  if (!entry || now - entry.windowStart > SLIDING_WINDOW_MS) {
    requestFingerprints.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export function checkTokenBucket(ip: string): boolean {
  const now = Date.now();
  const bucket = tokenBuckets.get(ip);

  if (!bucket) {
    tokenBuckets.set(ip, { tokens: TOKEN_BUCKET_CAPACITY - 1, lastRefill: now });
    return true;
  }

  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / 1000) * TOKEN_REFILL_RATE;
  bucket.tokens = Math.min(TOKEN_BUCKET_CAPACITY, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens <= 0) {
    return false;
  }

  bucket.tokens--;
  return true;
}

export function detectAttackPatterns(pathname: string, body?: string): string[] {
  const attacks: string[] = [];
  const lowerPath = pathname.toLowerCase();

  if (lowerPath.includes('../') || lowerPath.includes('..%2f') || lowerPath.includes('%2e%2e')) {
    attacks.push('path_traversal');
  }

  if (lowerPath.includes('<script') || lowerPath.includes('javascript:') || lowerPath.includes('onerror=') || lowerPath.includes('onload=')) {
    attacks.push('xss_attempt');
  }

  if (lowerPath.includes('union+') || lowerPath.includes('select+') || lowerPath.includes('insert+') || lowerPath.includes('delete+')) {
    attacks.push('sql_injection');
  }

  if (body) {
    const lowerBody = body.toLowerCase();
    if (lowerBody.includes('<script') || lowerBody.includes('javascript:')) {
      attacks.push('xss_attempt');
    }
    if (lowerBody.includes('union+') || lowerBody.includes('select+') || lowerBody.includes("' or '")) {
      attacks.push('sql_injection');
    }
  }

  if (lowerPath.includes('eval(') || lowerPath.includes('exec(') || lowerPath.includes('system(')) {
    attacks.push('code_injection');
  }

  if (lowerPath.includes('..\\') || lowerPath.includes('%2e%2e%5c')) {
    attacks.push('path_traversal');
  }

  return attacks;
}

export function generateFingerprint(request: Request): string {
  const ua = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';
  const acceptLang = request.headers.get('accept-language') || '';
  const acceptEnc = request.headers.get('accept-encoding') || '';
  const secFetchSite = request.headers.get('sec-fetch-site') || '';
  const secFetchMode = request.headers.get('sec-fetch-mode') || '';

  const data = `${ua}|${accept}|${acceptLang}|${acceptEnc}|${secFetchSite}|${secFetchMode}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function isValidRequest(request: Request): { valid: boolean; reason?: string } {
  const ua = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';

  if (!ua || ua.length < 10) {
    return { valid: false, reason: 'Invalid user agent' };
  }

  if (ua.length > 500) {
    return { valid: false, reason: 'User agent too long' };
  }

  if (!accept || (!accept.includes('text/html') && !accept.includes('application/json') && !accept.includes('*/*') && !accept.includes('text/event-stream'))) {
    if (!accept.includes('text/html')) {
      return { valid: false, reason: 'Invalid accept header' };
    }
  }

  const suspiciousPatterns = [
    /bot\s*\d/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /harvest/i,
    /extract/i,
    /collect/i,
    /gather/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(ua)) {
      return { valid: false, reason: 'Suspicious user agent pattern' };
    }
  }

  return { valid: true };
}

export function cleanupOldEntries(): void {
  const now = Date.now();

  for (const [ip, entry] of blockedIps) {
    if (now > entry.until) blockedIps.delete(ip);
  }

  for (const [ip, entry] of suspiciousIps) {
    entry.events = entry.events.filter(e => now - e.time < 300000);
    if (entry.events.length === 0) suspiciousIps.delete(ip);
  }

  for (const [ip, entry] of requestFingerprints) {
    if (now - entry.windowStart > SLIDING_WINDOW_MS * 2) requestFingerprints.delete(ip);
  }

  for (const [ip, bucket] of tokenBuckets) {
    if (now - bucket.lastRefill > 300000) tokenBuckets.delete(ip);
  }
}

setInterval(cleanupOldEntries, 5 * 60 * 1000);

export function getSecurityStats(): {
  blockedIps: number;
  suspiciousIps: number;
  activeRequests: number;
} {
  return {
    blockedIps: blockedIps.size,
    suspiciousIps: suspiciousIps.size,
    activeRequests: requestFingerprints.size,
  };
}
