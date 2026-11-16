// Normalisasi payload plan agar konsumen (pricing, dashboard, admin) tidak
// pernah menerima null/NaN pada field numerik maupun string wajib.
// Penyebab awal: PUT /api/admin/plans bisa menyimpan parseInt('') = NaN → JSON null.

const toInt = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

const toStr = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

export function normalizePlan<T extends Record<string, any> | null | undefined>(raw: T): T {
  if (!raw) return raw;
  return {
    ...raw,
    name: toStr((raw as any).name, 'Paket'),
    slug: toStr((raw as any).slug, 'paket'),
    price: Math.max(0, toInt((raw as any).price, 0)),
    requestsPerDay: Math.max(0, toInt((raw as any).requestsPerDay, 100)),
    requestsPerMin: Math.max(0, toInt((raw as any).requestsPerMin, 10)),
    requestsPerHour: Math.max(0, toInt((raw as any).requestsPerHour, 500)),
    description: typeof (raw as any).description === 'string' ? (raw as any).description : '',
    features: typeof (raw as any).features === 'string' ? (raw as any).features : '',
    featureAccess: toStr((raw as any).featureAccess, 'all'),
    popular: !!(raw as any).popular,
    active: (raw as any).active !== false,
  } as T;
}
