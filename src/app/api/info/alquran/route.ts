import { NextRequest, NextResponse } from 'next/server';
import { guardApiKey, logApiUsage } from '@/lib/apikey';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardApiKey(req, req.nextUrl.pathname);
    if ('response' in guard) return guard.response;
    const auth = guard.auth;
    const params = new URLSearchParams(req.nextUrl.searchParams);
    const nomor = params.get('nomor') || params.get('surat');

    const res = await fetch('https://api.npoint.io/99c279bb173a6e28359c/data', {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error('Gagal mengambil data Al-Quran');

    const data = await res.json();

    if (nomor) {
      const surat = data.find((s: any) => s.nomor === nomor || s.nomor === parseInt(nomor));
      if (!surat) {
        return NextResponse.json({
          success: false,
          error: `Surat dengan nomor ${nomor} tidak ditemukan`,
          endpoint: '/api/info/alquran',
        }, { status: 404 });
      }

      await logApiUsage(auth.keyId, auth.user.userId, '/api/info/alquran', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

      return NextResponse.json({
        success: true,
        creator: 'mazval',
        endpoint: '/api/info/alquran',
        data: surat,
      }, {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const daftarSurat = data.map((s: any) => ({
      nomor: s.nomor,
      nama: s.nama,
      asma: s.asma,
      ayat: s.ayat,
      type: s.type,
      arti: s.arti,
    }));

    await logApiUsage(auth.keyId, auth.user.userId, '/api/info/alquran', 'GET', 200, req.headers.get('x-forwarded-for') || undefined);

    return NextResponse.json({
      success: true,
      creator: 'mazval',
      endpoint: '/api/info/alquran',
      data: {
        total: daftarSurat.length,
        surat: daftarSurat,
      },
    }, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
