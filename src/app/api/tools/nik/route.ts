import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, logApiUsage } from '@/lib/apikey';

const NUSANTARA = 'https://nusantara.clowdlab.com/api/v1/nik/parse';
const EMSIFA = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

// Cadangan offline: NIK dibaca sendiri dari data wilayah emsifa.
// Kode kecamatan hanya 2 digit pada NIK sedangkan kode BPS 3 digit, jadi bila
// ada lebih dari satu kecamatan dengan kode sama namanya disebutkan semua.
async function parseNikLocal(nik: string, referenceYear?: number, centuryOverride?: number) {
  if (!/^\d{16}$/.test(nik)) return null;

  const provId = nik.slice(0, 2);
  const regencyId = nik.slice(0, 4);
  const kecCode = nik.slice(4, 6);
  let day = parseInt(nik.slice(6, 8), 10);
  const month = parseInt(nik.slice(8, 10), 10);
  const yy = parseInt(nik.slice(10, 12), 10);
  const serial = nik.slice(12, 16);

  let gender = 'MALE';
  if (day > 40) { gender = 'FEMALE'; day -= 40; }
  if (day < 1 || day > 31 || month < 1 || month > 12 || day > [31,29,31,30,31,30,31,31,30,31,30,31][month - 1]) return null;

  const refYear = Number(referenceYear) || new Date().getUTCFullYear();
  const century = Number(centuryOverride) || (yy > refYear % 100 ? 1900 : 2000);
  const year = century + yy;
  const birthDate = `${year}-${pad(month)}-${pad(day)}`;
  const parsed = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const lewat = now.getUTCMonth() + 1 > month || (now.getUTCMonth() + 1 === month && now.getUTCDate() >= day);
  if (!lewat) age -= 1;
  if (age < 0 || age > 150) return null;

  const getJson = async (url: string) => {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`wilayah ${res.status}`);
    return res.json();
  };

  const provinces: any[] = await getJson(`${EMSIFA}/provinces.json`);
  const province = provinces.find((p) => String(p.id) === provId);
  if (!province) return null;

  const regencies: any[] = await getJson(`${EMSIFA}/regencies/${provId}.json`);
  const regency = regencies.find((r) => String(r.id) === regencyId);
  if (!regency) return null;

  const districts: any[] = await getJson(`${EMSIFA}/districts/${regencyId}.json`);
  const kandidat = districts.filter((d) => String(d.id).slice(4, 6) === kecCode);
  const kodeWilayah = `${provId}${regencyId.slice(2)}${kecCode}`;

  return {
    nik,
    is_valid: true,
    gender,
    birth_date: birthDate,
    age,
    province: { id: provId, name: province.name },
    regency: { id: regencyId, name: regency.name },
    district: kandidat.length === 1
      ? { id: kandidat[0].id, name: kandidat[0].name }
      : { id: null, name: kandidat.map((d) => d.name).join(', ') || null },
    kode_wilayah: kodeWilayah,
    serial,
    sumber: 'data wilayah emsifa (cadangan lokal)',
    catatan: kandidat.length > 1
      ? 'Kode kecamatan NIK 2 digit cocok dengan lebih dari satu kecamatan pada data wilayah.'
      : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'API key tidak valid atau tidak aktif', endpoint: '/api/tools/nik' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(auth.keyId, auth.user.userId, auth.user.role, auth.user.tier);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Batas rate limit tercapai', data: { limit: rateCheck.limit, remaining: rateCheck.remaining } }, { status: 429 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { nik, reference_year, century_override } = body || {};

    if (!nik) {
      return NextResponse.json({
        success: false,
        error: 'Parameter nik diperlukan di body request',
        endpoint: '/api/tools/nik',
        example: { nik: '1101010101010001', reference_year: 2026, century_override: 2000 },
      }, { status: 400 });
    }

    const payload: any = { nik };
    if (reference_year) payload.reference_year = reference_year;
    if (century_override) payload.century_override = century_override;

    let data: any = null;
    // upstream sekali-sekali membalas 403 tanpa alasan, jadi dicoba ulang satu kali
    for (let attempt = 0; attempt < 2 && !data; attempt += 1) {
      try {
        const res = await fetch(NUSANTARA, {
          method: 'POST',
          headers: { accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        if (res.status === 404) {
          return NextResponse.json({
            success: false,
            error: 'NIK tidak ditemukan atau tidak valid',
            endpoint: '/api/tools/nik',
          }, { status: 404 });
        }

        if (res.ok) {
          data = await res.json().catch(() => null);
        }
      } catch {
        data = null;
      }
      if (!data && attempt === 0) await new Promise((r) => setTimeout(r, 700));
    }

    let sumber: string | undefined;
    if (!data) {
      data = await parseNikLocal(String(nik), reference_year, century_override).catch(() => null);
      if (data) sumber = data.sumber;
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Layanan parsing NIK tidak tersedia. Coba lagi beberapa saat lagi.',
        endpoint: '/api/tools/nik',
      }, { status: 502 });
    }

    await logApiUsage(auth.keyId, auth.user.userId, '/api/tools/nik', 'POST', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/tools/nik',
      ...(sumber ? { sumber } : {}),
      data,
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
