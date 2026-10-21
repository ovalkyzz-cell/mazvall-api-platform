import crypto from 'crypto';

/* =========================================================================
 * Penyimpanan state panel TANPA Neon / database eksternal.
 * Dokumen JSON (berisi semua koleksi: user, apiKey, plan, tiket, kupon, …)
 * disimpan sebagai satu berkas terenkripsi AES-256-GCM di repo GitHub privat
 * (STATE_GITHUB_REPO / STATE_GITHUB_PATH), diubah lewat Contents API.
 *
 * - Baca : cache memori per-instance (TTL pendek) supaya setiap request API
 *          tidak selalu memanggil GitHub.
 * - Tulis: read-modify-write dengan sya SHA terbaru (retry bila bentrok),
 *          sehingga beberapa instance Vercel tidak saling menimpa.
 * - Usage log (diproduksi tiap request API) dibuffer dulu di memori dan
 *          di-flush berkala supaya tidak membuat komit per request.
 * ======================================================================= */

export type Rec = Record<string, any>;

export interface StateDoc {
  v: number;
  updatedAt: string;
  users: Rec[];
  plans: Rec[];
  transactions: Rec[];
  apiKeys: Rec[];
  usageLogs: Rec[];
  tickets: Rec[];
  ticketReplies: Rec[];
  rateLimits: Rec[];
  systemConfigs: Rec[];
  coupons: Rec[];
  discounts: Rec[];
}

export function emptyState(): StateDoc {
  return {
    v: 1,
    updatedAt: new Date().toISOString(),
    users: [],
    plans: [],
    transactions: [],
    apiKeys: [],
    usageLogs: [],
    tickets: [],
    ticketReplies: [],
    rateLimits: [],
    systemConfigs: [],
    coupons: [],
    discounts: [],
  };
}

const USAGE_LOG_CAP = 800;
const MEMORY_TTL_MS = 10_000;
const FLUSH_DELAY_MS = 8_000;
const REQUEST_TIMEOUT_MS = 8_000;
const STORAGE_PREFIX = 'State storage tidak terjangkau';

// Galat storage sengaja memakai kode P1001 supaya seluruh jalur fail-open
// lama (staticAuth / isDbUnavailable) tetap mengenali "database tak terjangkau"
// dan panel tetap berjalan, bukan 500.
export function storageError(reason: string): any {
  const err: any = new Error(`${STORAGE_PREFIX}: ${reason}`);
  err.code = 'P1001';
  err.storage = true;
  return err;
}

export function isStorageError(err: unknown): boolean {
  const e = err as any;
  return !!e && (e.storage === true || e.code === 'P1001');
}

function env(name: string): string {
  const value = (process.env[name] || '').trim();
  if (!value) throw storageError(`env ${name} belum diatur`);
  return value;
}

function encryptionKey(): Buffer {
  const raw = env('STATE_ENCRYPTION_KEY');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw storageError('STATE_ENCRYPTION_KEY harus 32 byte base64');
  return key;
}

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

function decrypt(payload: string): string {
  const [version, ivRaw, tagRaw, dataRaw] = payload.split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !dataRaw) throw storageError('format berkas state tidak dikenal');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataRaw, 'base64url')), decipher.final()]).toString('utf8');
}

function apiUrl(): string {
  const repo = env('STATE_GITHUB_REPO');
  const path = process.env.STATE_GITHUB_PATH?.trim() || 'state.enc';
  return `https://api.github.com/repos/${repo}/contents/${path}`;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${env('STATE_GITHUB_TOKEN')}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'mazval-state-store',
  };
}

async function request(url: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw storageError(`jaringan ke GitHub gagal (${(lastErr as any)?.message || lastErr})`);
}

interface RemoteDoc {
  sha: string | null;
  doc: StateDoc;
}

async function githubRead(): Promise<RemoteDoc> {
  const res = await request(apiUrl(), { method: 'GET', headers: headers() });
  if (res.status === 404) return { sha: null, doc: emptyState() };
  if (res.status !== 200) {
    const text = (await res.text()).slice(0, 160);
    throw storageError(`GitHub membaca ${res.status}: ${text}`);
  }
  const body: any = await res.json();
  const content = String(body.content || '').replace(/\n/g, '');
  if (!content) {
    // berkas ada tapi kosong/tidak terbaca (mis. terlalu besar) — jangan
    // dianggap dokumen kosong agar data tidak hilang diam-diam
    if (Number(body.size || 0) > 0) throw storageError('berkas state tidak terbaca (ukuran terlalu besar?)');
    return { sha: body.sha || null, doc: emptyState() };
  }
  let json: string;
  try {
    json = decrypt(Buffer.from(content, 'base64').toString('utf8'));
  } catch (err) {
    if (isStorageError(err)) throw err;
    throw storageError('gagal dekripsi berkas state');
  }
  try {
    const doc = { ...emptyState(), ...JSON.parse(json) } as StateDoc;
    return { sha: body.sha || null, doc };
  } catch {
    throw storageError('berkas state korup');
  }
}

async function githubWrite(doc: StateDoc, sha: string | null): Promise<string> {
  doc.updatedAt = new Date().toISOString();
  const payload = Buffer.from(encrypt(JSON.stringify(doc)), 'utf8').toString('base64');
  const res = await request(apiUrl(), {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `state: update ${doc.updatedAt}`,
      content: payload,
      ...(sha ? { sha } : {}),
    }),
  });

  if (res.status === 409 || res.status === 422) {
    const conflict: any = storageError(`konflik tulis (${res.status})`);
    conflict.conflict = true;
    throw conflict;
  }
  if (res.status !== 200 && res.status !== 201) {
    const text = (await res.text()).slice(0, 160);
    throw storageError(`GitHub menulis ${res.status}: ${text}`);
  }
  const body: any = await res.json();
  return body?.content?.sha || '';
}

/* ------------------------------- cache ------------------------------- */

interface Memory {
  doc: StateDoc | null;
  loadedAt: number;
  buffer: Rec[];
  flushTimer: NodeJS.Timeout | null;
  flushing: Promise<void> | null;
}

const memory: Memory = { doc: null, loadedAt: 0, buffer: [], flushTimer: null, flushing: null };

function withBufferedUsage(doc: StateDoc): StateDoc {
  if (memory.buffer.length === 0) return doc;
  return { ...doc, usageLogs: [...doc.usageLogs, ...memory.buffer] } as StateDoc;
}

/** Dokumen kerja untuk dibaca (memori + usage log yang belum di-flush). */
export async function loadState(options: { fresh?: boolean } = {}): Promise<StateDoc> {
  const now = Date.now();
  const stale = !memory.doc || now - memory.loadedAt > MEMORY_TTL_MS;
  if (!options.fresh && !stale) return withBufferedUsage(memory.doc!);

  if (!options.fresh && memory.doc) {
    // coba segarkan; bila GitHub gagal, tetap layani memori
    try {
      const remote = await githubRead();
      memory.doc = remote.doc;
      memory.loadedAt = now;
      return withBufferedUsage(remote.doc);
    } catch {
      memory.loadedAt = now;
      return withBufferedUsage(memory.doc!);
    }
  }

  try {
    const remote = await githubRead();
    memory.doc = remote.doc;
    memory.loadedAt = now;
    return withBufferedUsage(remote.doc);
  } catch (err) {
    if (memory.doc) return withBufferedUsage(memory.doc);
    throw isStorageError(err) ? err : storageError((err as any)?.message || 'gagal memuat');
  }
}

/**
 * Read-modify-write aman antar-instance: selalu membaca SHA terbaru dari
 * GitHub, menerapkan mutasi, lalu menulis ulang; bentrok SHA diulang.
 */
export async function mutateState<T>(fn: (doc: StateDoc) => T): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    let remote: RemoteDoc;
    try {
      remote = await githubRead();
    } catch (err) {
      lastError = err;
      break;
    }
    let result: T;
    try {
      result = fn(remote.doc);
    } catch (err) {
      throw err;
    }
    try {
      await githubWrite(remote.doc, remote.sha);
      memory.doc = remote.doc;
      memory.loadedAt = Date.now();
      return result;
    } catch (err: any) {
      if (err?.conflict) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw isStorageError(lastError) ? lastError : storageError('tulis state gagal berulang');
}

/* --------------------------- usage log buffer --------------------------- */

function scheduleFlush(): void {
  if (memory.flushTimer) return;
  memory.flushTimer = setTimeout(() => {
    memory.flushTimer = null;
    void flushUsageLogs().catch(() => {
      /* flush berikutnya akan mencoba lagi */
    });
  }, FLUSH_DELAY_MS);
  memory.flushTimer.unref?.();
}

/** Simpan log penggunaan ke buffer lalu flush berkala (bukan per request). */
export function bufferUsageLog(rec: Rec): void {
  memory.buffer.push(rec);
  if (memory.buffer.length > USAGE_LOG_CAP) {
    memory.buffer.splice(0, memory.buffer.length - USAGE_LOG_CAP);
  }
  scheduleFlush();
}

export function pendingUsageCount(): number {
  return memory.buffer.length;
}

export async function flushUsageLogs(): Promise<void> {
  if (memory.flushing) return memory.flushing;
  if (memory.buffer.length === 0) return;

  const run = (async () => {
    const pending = memory.buffer;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let remote: RemoteDoc;
      try {
        remote = await githubRead();
      } catch {
        return; // biarkan di buffer, dicoba lagi pada flush berikutnya
      }
      const known = new Set(remote.doc.usageLogs.map((r) => r.id));
      const toAdd = pending.filter((r) => !known.has(r.id));
      remote.doc.usageLogs = [...remote.doc.usageLogs, ...toAdd].slice(-USAGE_LOG_CAP);
      try {
        await githubWrite(remote.doc, remote.sha);
        const flushedIds = new Set(pending.map((r) => r.id));
        memory.buffer = memory.buffer.filter((r) => !flushedIds.has(r.id));
        memory.doc = remote.doc;
        memory.loadedAt = Date.now();
        return;
      } catch (err: any) {
        if (!err?.conflict) return;
      }
    }
  })();

  memory.flushing = run.finally(() => {
    memory.flushing = null;
  });
  return memory.flushing;
}

/** Tangkap keluaran fungsi serverless supaya buffer log sempat di-flush. */
let exitHookRegistered = false;
export function registerFlushOnExit(): void {
  if (exitHookRegistered) return;
  exitHookRegistered = true;
  const handler = () => {
    void flushUsageLogs().catch(() => undefined);
  };
  process.on('beforeExit', handler);
  process.on('SIGTERM', handler);
}
registerFlushOnExit();

/** Uji cepat koneksi storage (dipakai health check). */
export async function pingStateStorage(): Promise<{ ok: boolean; source: 'github' | 'memory' | 'none'; error?: string }> {
  try {
    const remote = await githubRead();
    memory.doc = remote.doc;
    memory.loadedAt = Date.now();
    return { ok: true, source: 'github' };
  } catch (err: any) {
    if (memory.doc) return { ok: true, source: 'memory', error: String(err?.message || err).slice(0, 120) };
    return { ok: false, source: 'none', error: String(err?.message || err).slice(0, 120) };
  }
}
