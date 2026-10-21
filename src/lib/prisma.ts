import { randomUUID } from 'crypto';
import {
  bufferUsageLog,
  flushUsageLogs,
  loadState,
  mutateState,
  pendingUsageCount,
  StateDoc,
  Rec,
} from './stateStore';

/* =========================================================================
 * Pengganti PrismaClient TANPA database.
 * Semua model dibaca/ditulis lewat stateStore (berkas terenkripsi di GitHub
 * privat). API-nya meniru subset Prisma yang dipakai seluruh rute:
 * findUnique/findFirst/findMany/create/update/delete/upsert/count/aggregate/
 * groupBy/$transaction/$queryRaw — termasuk where, orderBy, select, include,
 * _count, dan error kode Prisma (P2002/P2025) supaya perilaku rute lama
 * tetap sama persis.
 * ======================================================================= */

export const getTierLimits = (tier: string) => {
  const limits: Record<string, { rpm: number; rph: number; rpd: number }> = {
    free: { rpm: 30, rph: 200, rpd: 1000 },
    Gratis: { rpm: 30, rph: 200, rpd: 1000 },
    developer: { rpm: 60, rph: 2000, rpd: 20000 },
    enterprise: { rpm: 300, rph: 10000, rpd: 100000 },
  };
  return limits[tier] || limits.free;
};

type ModelName =
  | 'user'
  | 'plan'
  | 'transaction'
  | 'apiKey'
  | 'usageLog'
  | 'ticket'
  | 'ticketReply'
  | 'rateLimitConfig'
  | 'systemConfig'
  | 'coupon'
  | 'discount';

interface ModelSpec {
  collection: Exclude<keyof StateDoc, 'v' | 'updatedAt'>;
  dates: string[];
  defaults: () => Rec;
  unique: string[][];
}

const now = () => new Date();
const newId = () => randomUUID().replace(/-/g, '');

const MODELS: Record<ModelName, ModelSpec> = {
  user: {
    collection: 'users',
    dates: ['planExpiry', 'lastRequestReset', 'createdAt', 'updatedAt'],
    defaults: () => ({
      role: 'user',
      tier: 'free',
      status: 'active',
      planId: null,
      planExpiry: null,
      requestsToday: 0,
      lastRequestReset: now(),
      avatar: null,
      createdAt: now(),
      updatedAt: now(),
    }),
    unique: [['email']],
  },
  plan: {
    collection: 'plans',
    dates: ['discountExpiresAt', 'createdAt'],
    defaults: () => ({
      featureAccess: 'all',
      popular: false,
      active: true,
      discountCode: null,
      discountType: 'percentage',
      discountValue: null,
      discountMaxUses: null,
      discountUsedCount: 0,
      discountExpiresAt: null,
      createdAt: now(),
    }),
    unique: [['name'], ['slug']],
  },
  transaction: {
    collection: 'transactions',
    dates: ['paidAt', 'createdAt', 'updatedAt'],
    defaults: () => ({
      transactionId: null,
      qrUrl: null,
      paymentUrl: null,
      status: 'pending',
      discountId: null,
      paidAt: null,
      createdAt: now(),
      updatedAt: now(),
    }),
    unique: [],
  },
  apiKey: {
    collection: 'apiKeys',
    dates: ['expiresAt', 'lastUsedAt', 'createdAt'],
    defaults: () => ({
      active: true,
      rateLimit: 100,
      expiresAt: null,
      lastUsedAt: null,
      createdAt: now(),
    }),
    unique: [['key']],
  },
  usageLog: {
    collection: 'usageLogs',
    dates: ['createdAt'],
    defaults: () => ({ ip: null, createdAt: now() }),
    unique: [],
  },
  ticket: {
    collection: 'tickets',
    dates: ['createdAt', 'updatedAt'],
    defaults: () => ({
      status: 'open',
      priority: 'normal',
      category: 'general',
      createdAt: now(),
      updatedAt: now(),
    }),
    unique: [],
  },
  ticketReply: {
    collection: 'ticketReplies',
    dates: ['createdAt'],
    defaults: () => ({ isAdmin: false, createdAt: now() }),
    unique: [],
  },
  rateLimitConfig: {
    collection: 'rateLimits',
    dates: [],
    defaults: () => ({ description: null }),
    unique: [['tier']],
  },
  systemConfig: {
    collection: 'systemConfigs',
    dates: [],
    defaults: () => ({}),
    unique: [['key']],
  },
  coupon: {
    collection: 'coupons',
    dates: ['expiresAt', 'createdAt', 'updatedAt'],
    defaults: () => ({
      planId: null,
      discountType: 'percentage',
      maxUses: 1,
      usedCount: 0,
      active: true,
      expiresAt: null,
      createdAt: now(),
      updatedAt: now(),
    }),
    unique: [['code']],
  },
  discount: {
    collection: 'discounts',
    dates: ['validFrom', 'validUntil', 'createdAt', 'updatedAt'],
    defaults: () => ({
      description: null,
      percentage: 0,
      maxUses: 100,
      usedCount: 0,
      validFrom: now(),
      validUntil: null,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    }),
    unique: [['code']],
  },
};

type Relation = { model: ModelName; fk: string; many?: boolean };

const RELATIONS: Record<ModelName, Record<string, Relation>> = {
  user: {
    apiKeys: { model: 'apiKey', fk: 'userId', many: true },
    usageLogs: { model: 'usageLog', fk: 'userId', many: true },
    tickets: { model: 'ticket', fk: 'userId', many: true },
    ticketReplies: { model: 'ticketReply', fk: 'userId', many: true },
    transactions: { model: 'transaction', fk: 'userId', many: true },
    discounts: { model: 'discount', fk: 'createdBy', many: true },
  },
  plan: {
    coupons: { model: 'coupon', fk: 'planId', many: true },
    transactions: { model: 'transaction', fk: 'planId', many: true },
  },
  transaction: {
    user: { model: 'user', fk: 'userId' },
    plan: { model: 'plan', fk: 'planId' },
    discount: { model: 'discount', fk: 'discountId' },
  },
  apiKey: {
    user: { model: 'user', fk: 'userId' },
    usageLogs: { model: 'usageLog', fk: 'apiKeyId', many: true },
  },
  usageLog: {
    user: { model: 'user', fk: 'userId' },
    apiKey: { model: 'apiKey', fk: 'apiKeyId' },
  },
  ticket: {
    user: { model: 'user', fk: 'userId' },
    replies: { model: 'ticketReply', fk: 'ticketId', many: true },
  },
  ticketReply: {
    user: { model: 'user', fk: 'userId' },
    ticket: { model: 'ticket', fk: 'ticketId' },
  },
  coupon: { plan: { model: 'plan', fk: 'planId' } },
  discount: {
    creator: { model: 'user', fk: 'createdBy' },
    transactions: { model: 'transaction', fk: 'discountId', many: true },
  },
  rateLimitConfig: {},
  systemConfig: {},
};

/* ------------------------------ galat ------------------------------ */

function prismaError(code: string, message: string): any {
  const err: any = new Error(message);
  err.code = code;
  return err;
}

const notFound = () => prismaError('P2025', 'Record to delete does not exist.');
const uniqueViolation = (field: string) =>
  prismaError('P2002', `Unique constraint failed on the fields: (\`${field}\`)`);

/* ---------------------------- perbandingan ---------------------------- */

function toTime(value: any): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && /\d{4}-\d{2}-\d{2}/.test(value)) return parsed;
  }
  return null;
}

function looseEquals(fieldValue: any, expected: any): boolean {
  if (fieldValue === expected) return true;
  if (fieldValue === null || expected === null || fieldValue === undefined || expected === undefined) {
    return (fieldValue ?? null) === (expected ?? null);
  }
  const a = toTime(fieldValue);
  const b = toTime(expected);
  if (a !== null && b !== null) return a === b;
  return String(fieldValue) === String(expected);
}

function compare(fieldValue: any, expected: any): number {
  const a = toTime(fieldValue);
  const b = toTime(expected);
  if (a !== null && b !== null) return a - b;
  if (typeof fieldValue === 'number' && typeof expected === 'number') return fieldValue - expected;
  const sa = String(fieldValue);
  const sb = String(expected);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function matchCondition(fieldValue: any, cond: any): boolean {
  if (cond === null) return fieldValue === null || fieldValue === undefined;
  if (cond instanceof Date || typeof cond !== 'object' || Array.isArray(cond)) {
    return looseEquals(fieldValue, cond);
  }

  let ok = true;
  if ('equals' in cond) {
    const expected = cond.equals;
    if (cond.mode === 'insensitive') {
      ok =
        ok &&
        String(fieldValue ?? '')
          .toLowerCase() ===
          String(expected ?? '').toLowerCase();
    } else {
      ok = ok && looseEquals(fieldValue, expected);
    }
  }
  if ('in' in cond) {
    ok = ok && (cond.in as any[]).some((value) => looseEquals(fieldValue, value));
  }
  if ('not' in cond) {
    const notCond = cond.not;
    const negated =
      notCond !== null && typeof notCond === 'object' && !(notCond instanceof Date)
        ? matchCondition(fieldValue, notCond)
        : looseEquals(fieldValue, notCond);
    ok = ok && !negated;
  }
  if ('gt' in cond) ok = ok && compare(fieldValue, cond.gt) > 0;
  if ('gte' in cond) ok = ok && compare(fieldValue, cond.gte) >= 0;
  if ('lt' in cond) ok = ok && compare(fieldValue, cond.lt) < 0;
  if ('lte' in cond) ok = ok && compare(fieldValue, cond.lte) <= 0;
  return ok;
}

function matchWhere(row: Rec, where: any): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (key === 'OR') {
      if (!(cond as any[]).some((sub) => matchWhere(row, sub))) return false;
      continue;
    }
    if (key === 'AND') {
      if (!(cond as any[]).every((sub) => matchWhere(row, sub))) return false;
      continue;
    }
    if (key === 'NOT') {
      const subs = Array.isArray(cond) ? cond : [cond];
      if (subs.some((sub: any) => matchWhere(row, sub))) return false;
      continue;
    }
    if (!matchCondition(row[key], cond)) return false;
  }
  return true;
}

function sortRows(rows: Rec[], orderBy: any): Rec[] {
  if (!orderBy) return rows;
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const clause of clauses) {
      for (const [field, dir] of Object.entries(clause)) {
        if (field === '_count' || typeof dir === 'object') continue;
        const cmp = compare(a[field], b[field]);
        if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
      }
    }
    return 0;
  });
}

/* ---------------------------- proyeksi ---------------------------- */

function reviveDates(model: ModelName, row: Rec): Rec {
  const out: Rec = { ...row };
  for (const field of MODELS[model].dates) {
    const value = out[field];
    if (typeof value === 'string' || typeof value === 'number') {
      const time = Date.parse(String(value));
      if (!Number.isNaN(time) && /\d{4}-\d{2}-\d{2}/.test(String(value))) out[field] = new Date(time);
    }
  }
  return out;
}

function relatedRows(doc: StateDoc, model: ModelName, row: Rec, rel: Relation): Rec[] {
  const key = MODELS[rel.model].collection;
  if (rel.many) {
    // relasi one-to-many: pihak anak yang menyimpan foreign key
    return doc[key].filter((candidate) => candidate[rel.fk] === row.id);
  }
  // relasi many-to-one/one-to-one: baris induk yang menyimpan foreign key
  return doc[key].filter((candidate) => candidate.id === row[rel.fk]);
}

function projectRow(
  doc: StateDoc,
  model: ModelName,
  row: Rec,
  args: { select?: any; include?: any } = {}
): Rec {
  const base = reviveDates(model, row);
  const relations = RELATIONS[model] || {};

  const resolveRelation = (name: string, spec: any): Rec | Rec[] | null => {
    const rel = relations[name];
    if (!rel) return null;
    const related = relatedRows(doc, model, row, rel);
    const ordered = sortRows(related, spec?.orderBy);
    const projected = ordered.map((child) => projectRow(doc, rel.model, child, spec || {}));
    if (rel.many) {
      const sliced = typeof spec?.take === 'number' ? projected.slice(0, spec.take) : projected;
      return sliced;
    }
    return projected[0] ?? null;
  };

  const buildCount = (select: any): Rec => {
    const counts: Rec = {};
    for (const [name, wanted] of Object.entries(select || {})) {
      if (!wanted) continue;
      const rel = relations[name];
      counts[name] = rel ? relatedRows(doc, model, row, rel).length : 0;
    }
    return counts;
  };

  if (args.select) {
    const out: Rec = {};
    for (const [key, wanted] of Object.entries(args.select)) {
      if (!wanted) continue;
      if (key === '_count') {
        out._count = buildCount((wanted as any)?.select);
        continue;
      }
      if (relations[key]) {
        out[key] = resolveRelation(key, wanted === true ? {} : wanted);
        continue;
      }
      out[key] = base[key];
    }
    return out;
  }

  const out: Rec = { ...base };
  if (args.include) {
    for (const [key, spec] of Object.entries(args.include)) {
      if (!spec) continue;
      if (key === '_count') {
        out._count = buildCount((spec as any)?.select);
        continue;
      }
      out[key] = resolveRelation(key, spec === true ? {} : spec);
    }
  }
  return out;
}

/* --------------------------- akses koleksi --------------------------- */

async function readRows(model: ModelName, args: any = {}): Promise<Rec[]> {
  const doc = await loadState();
  const key = MODELS[model].collection;
  let rows = doc[key].filter((row) => matchWhere(row, args.where));
  rows = sortRows(rows, args.orderBy);
  if (typeof args.skip === 'number' && args.skip > 0) rows = rows.slice(args.skip);
  if (typeof args.take === 'number') rows = rows.slice(0, args.take);
  return rows;
}

function buildRecord(model: ModelName, data: Rec): Rec {
  const spec = MODELS[model];
  const rec: Rec = { id: newId(), ...spec.defaults() };
  for (const [field, value] of Object.entries(data || {})) {
    if (value === undefined) continue;
    rec[field] = value;
  }
  return rec;
}

function assertUnique(doc: StateDoc, model: ModelName, candidate: Rec, ignoreId?: string): void {
  const spec = MODELS[model];
  const key = spec.collection;
  for (const fields of spec.unique) {
    const collision = doc[key].some(
      (row) =>
        row.id !== ignoreId &&
        fields.every((field) => looseEquals(row[field], candidate[field]))
    );
    if (collision) throw uniqueViolation(fields[0]);
  }
}

function applyUpdate(model: ModelName, row: Rec, data: Rec): void {
  for (const [field, value] of Object.entries(data || {})) {
    if (value === undefined) continue;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const op = value as Rec;
      if ('increment' in op) {
        row[field] = (Number(row[field]) || 0) + Number(op.increment);
        continue;
      }
      if ('decrement' in op) {
        row[field] = (Number(row[field]) || 0) - Number(op.decrement);
        continue;
      }
      if ('set' in op) {
        row[field] = op.set;
        continue;
      }
    }
    row[field] = value;
  }
  if (MODELS[model].dates.includes('updatedAt')) row.updatedAt = new Date();
}

/* ----------------------------- delegate ----------------------------- */

// bentuk minimal yang dipakai seluruh rute (tanpa tipe Prisma yang berat)
interface Delegate {
  findUnique(args?: any): Promise<Rec | null>;
  findFirst(args?: any): Promise<Rec | null>;
  findMany(args?: any): Promise<Rec[]>;
  count(args?: any): Promise<number>;
  aggregate(args?: any): Promise<any>;
  groupBy(args?: any): Promise<any[]>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
  upsert(args: any): Promise<any>;
}

interface PrismaLike {
  user: Delegate;
  plan: Delegate;
  transaction: Delegate;
  apiKey: Delegate;
  usageLog: Delegate;
  ticket: Delegate;
  ticketReply: Delegate;
  rateLimitConfig: Delegate;
  systemConfig: Delegate;
  coupon: Delegate;
  discount: Delegate;
  $transaction(arg: any): Promise<any>;
  $queryRaw(strings: TemplateStringsArray, ...values: any[]): Promise<any>;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

function makeDelegate(model: ModelName): Delegate {
  const spec = MODELS[model];

  const afterWrite = (doc: StateDoc, row: Rec, args: any = {}) =>
    projectRow(doc, model, row, args);

  return {
    async findUnique(args: any = {}) {
      const rows = await readRows(model, { where: args.where, take: 1 });
      if (!rows.length) return null;
      const doc = await loadState();
      return projectRow(doc, model, rows[0], args);
    },

    async findFirst(args: any = {}) {
      const rows = await readRows(model, { where: args.where, orderBy: args.orderBy, take: 1 });
      if (!rows.length) return null;
      const doc = await loadState();
      return projectRow(doc, model, rows[0], args);
    },

    async findMany(args: any = {}) {
      const rows = await readRows(model, args);
      const doc = await loadState();
      return rows.map((row) => projectRow(doc, model, row, args));
    },

    async count(args: any = {}) {
      const rows = await readRows(model, { where: args.where });
      return rows.length;
    },

    async aggregate(args: any = {}) {
      const rows = await readRows(model, { where: args.where });
      const out: Rec = {};
      if (args._sum) {
        const sums: Rec = {};
        for (const field of Object.keys(args._sum)) {
          const total = rows.reduce((acc, row) => {
            const value = Number(row[field]);
            return acc + (Number.isFinite(value) ? value : 0);
          }, 0);
          sums[field] = rows.length ? total : null;
        }
        out._sum = sums;
      }
      if (args._count !== undefined) out._count = rows.length;
      if (args._avg) {
        const avgs: Rec = {};
        for (const field of Object.keys(args._avg)) {
          const total = rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
          avgs[field] = rows.length ? total / rows.length : null;
        }
        out._avg = avgs;
      }
      return out;
    },

    async groupBy(args: any = {}) {
      const by: string[] = args.by || [];
      const rows = await readRows(model, { where: args.where });
      const groups = new Map<string, Rec[]>();
      for (const row of rows) {
        const key = by.map((field) => String(row[field])).join('\u0000');
        const bucket = groups.get(key);
        if (bucket) bucket.push(row);
        else groups.set(key, [row]);
      }

      let result: Rec[] = [...groups.values()].map((bucket) => {
        const out: Rec = {};
        for (const field of by) out[field] = bucket[0][field];
        if (args._count !== undefined) out._count = bucket.length;
        if (args._sum) {
          const sums: Rec = {};
          for (const field of Object.keys(args._sum)) {
            sums[field] = bucket.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
          }
          out._sum = sums;
        }
        if (args._avg) {
          const avgs: Rec = {};
          for (const field of Object.keys(args._avg)) {
            avgs[field] = bucket.reduce((acc, row) => acc + (Number(row[field]) || 0), 0) / bucket.length;
          }
          out._avg = avgs;
        }
        return out;
      });

      const orderBy = args.orderBy;
      if (orderBy && typeof orderBy === 'object' && orderBy._count) {
        const [field, dir] = Object.entries(orderBy._count as Rec)[0] as [string, string];
        result.sort((a, b) => {
          const cmp = compare(a._count, b._count);
          return dir === 'desc' ? -cmp : cmp;
        });
      }
      if (typeof args.take === 'number') result = result.slice(0, args.take);
      if (typeof args.skip === 'number') result = result.slice(args.skip);
      return result;
    },

    async create(args: any) {
      const data = args.data || {};

      // log pemakaian dibuffer agar tidak menulis GitHub tiap request API
      if (model === 'usageLog') {
        const rec = buildRecord(model, data);
        bufferUsageLog(rec);
        if (pendingUsageCount() >= 25) {
          try {
            await flushUsageLogs();
          } catch {
            // biarkan; buffer masih menyimpan log untuk flush berikutnya
          }
        }
        // log penggunaan tidak boleh menjatuhkan respons API
        try {
          const doc = await loadState();
          return projectRow(doc, model, rec, args);
        } catch {
          return reviveDates(model, rec);
        }
      }

      return mutateState((doc) => {
        const rec = buildRecord(model, data);
        assertUnique(doc, model, rec);
        doc[spec.collection].push(rec);
        return afterWrite(doc, rec, args);
      });
    },

    async update(args: any) {
      return mutateState((doc) => {
        const row = doc[spec.collection].find((candidate) => matchWhere(candidate, args.where));
        if (!row) throw notFound();
        if (args.data) {
          const patch: Rec = {};
          for (const [field, value] of Object.entries(args.data)) {
            if (value !== undefined) patch[field] = value;
          }
          const probe = { ...row, ...patch };
          assertUnique(doc, model, probe, row.id);
        }
        applyUpdate(model, row, args.data || {});
        return afterWrite(doc, row, args);
      });
    },

    async delete(args: any) {
      return mutateState((doc) => {
        const index = doc[spec.collection].findIndex((candidate) => matchWhere(candidate, args.where));
        if (index < 0) throw notFound();
        const [row] = doc[spec.collection].splice(index, 1);
        return afterWrite(doc, row, args);
      });
    },

    async upsert(args: any) {
      return mutateState((doc) => {
        const row = doc[spec.collection].find((candidate) => matchWhere(candidate, args.where));
        if (row) {
          applyUpdate(model, row, args.update || {});
          return afterWrite(doc, row, args);
        }
        const rec = buildRecord(model, args.create || {});
        assertUnique(doc, model, rec);
        doc[spec.collection].push(rec);
        return afterWrite(doc, rec, args);
      });
    },
  };
}

export const prisma: PrismaLike = {
  user: makeDelegate('user'),
  plan: makeDelegate('plan'),
  transaction: makeDelegate('transaction'),
  apiKey: makeDelegate('apiKey'),
  usageLog: makeDelegate('usageLog'),
  ticket: makeDelegate('ticket'),
  ticketReply: makeDelegate('ticketReply'),
  rateLimitConfig: makeDelegate('rateLimitConfig'),
  systemConfig: makeDelegate('systemConfig'),
  coupon: makeDelegate('coupon'),
  discount: makeDelegate('discount'),

  async $transaction(arg: any) {
    if (Array.isArray(arg)) {
      const results: any[] = [];
      for (const item of arg) results.push(await item);
      return results;
    }
    if (typeof arg === 'function') return arg(prisma);
    return arg;
  },

  async $queryRaw(_strings: TemplateStringsArray, ..._values: any[]) {
    return [{ ok: 1 }];
  },

  async $disconnect() {
    return undefined;
  },

  async $connect() {
    return undefined;
  },
};

export default prisma;
