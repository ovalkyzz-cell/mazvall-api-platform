import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiHandler';
import { logApiUsage } from '@/lib/apikey';
import { gunzipSync } from 'zlib';
import { parseTar, buildZip } from '@/lib/zip';

const SERVICE = '/api/tools/npm2zip';

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message, endpoint: SERVICE }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const a = await authenticateRequest(req, SERVICE);
    if ('response' in a) return a.response;
    const { user, keyId } = a.auth;
    const ip = req.headers.get('x-forwarded-for') || undefined;

    const sp = req.nextUrl.searchParams;
    const pkg = (sp.get('package') || sp.get('pkg') || '').trim();
    const versionParam = (sp.get('version') || '').trim();
    if (!pkg) return err('Parameter package wajib diisi. Contoh: ?package=express', 400);
    if (!/^(@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/i.test(pkg)) {
      return err('Nama package tidak valid. Format: nama atau @scope/nama', 400);
    }

    const metaUrl = versionParam
      ? `https://registry.npmjs.org/${encodeURIComponent(pkg)}/${encodeURIComponent(versionParam)}`
      : `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`;
    const metaRes = await fetch(metaUrl, { signal: AbortSignal.timeout(15000) });
    if (metaRes.status === 404) {
      return err(`Package "${pkg}"${versionParam ? ` versi ${versionParam}` : ''} tidak ditemukan di npm`, 404);
    }
    if (!metaRes.ok) return err('Registry npm tidak dapat diakses', 502);
    const ver = await metaRes.json();
    const tarballUrl = ver?.dist?.tarball;
    if (!tarballUrl || !ver?.version) return err('Metadata package tidak lengkap dari registry npm', 502);

    const unpacked = Number(ver.dist?.unpackedSize) || 0;
    const packed = Number(ver.dist?.size) || 0;
    if (unpacked > 25_000_000 || packed > 15_000_000) {
      return err('Package terlalu besar untuk dikonversi (maksimal 15MB terkompresi atau 25MB terbuka)', 413);
    }

    const tgzRes = await fetch(tarballUrl, { signal: AbortSignal.timeout(30000) });
    if (!tgzRes.ok) return err('Tarball package tidak dapat diunduh dari registry npm', 502);
    const tgz = Buffer.from(await tgzRes.arrayBuffer());

    let tar: Buffer;
    try {
      tar = gunzipSync(tgz);
    } catch {
      return err('Gagal mendekompresi tarball package', 502);
    }

    const entries = parseTar(tar)
      .map(f => ({ name: f.name.replace(/^package\//, ''), data: f.data }))
      .filter(f => f.name);
    if (entries.length === 0) return err('Package tidak berisi file', 502);
    if (entries.length > 3000) return err('Package berisi terlalu banyak file (maksimal 3000 file)', 413);

    const zip = buildZip(entries);
    await logApiUsage(keyId, user.userId, SERVICE, 'GET', 200, ip);

    const filename = `${pkg.replace(/\//g, '-')}-${ver.version}.zip`;
    return new Response(new Uint8Array(zip), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Package': `${pkg}@${ver.version}`,
        'X-File-Count': String(entries.length),
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return err(error?.message || 'Terjadi kesalahan server', 500);
  }
}
