import { NextRequest, NextResponse } from 'next/server';

/**
 * Penangkap path /api/* yang tidak dikenal. Tanpa berkas ini Next menjawab 404
 * berupa halaman HTML (x-matched-path=/404), padahal konsumen API mengharapkan
 * JSON seperti endpoint lain. Route statis selalu menang atas catch-all ini.
 */
function notFound(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint tidak ditemukan',
      path: req.nextUrl.pathname,
    },
    { status: 404 }
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
