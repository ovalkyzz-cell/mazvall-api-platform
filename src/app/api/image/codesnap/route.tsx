import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { authenticateRequest } from '@/lib/apiHandler';
import { logApiUsage } from '@/lib/apikey';

const SERVICE = '/api/image/codesnap';

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
    const text = (sp.get('text') || sp.get('code') || sp.get('q') || '').trim();
    if (!text) return err('Parameter text wajib diisi. Contoh: ?text=console.log("halo")', 400);

    const lines = text.split('\n').slice(0, 120);
    const display = lines.join('\n');
    const height = Math.min(3600, Math.max(320, 120 + lines.length * 28));
    const fontSize = Number(sp.get('fontSize')) || 22;

    const image = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0d1117',
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px 28px',
              gap: 12,
              borderBottom: '1px solid #30363d',
            }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 18, backgroundColor: '#ff5f57' }} />
            <div style={{ width: 18, height: 18, borderRadius: 18, backgroundColor: '#febc2e' }} />
            <div style={{ width: 18, height: 18, borderRadius: 18, backgroundColor: '#28c840' }} />
            <div style={{ display: 'flex', color: '#8b949e', fontSize: 18, marginLeft: 16 }}>codesnap — mazvall</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: '28px 36px',
              color: '#e6edf3',
              fontSize,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {display}
          </div>
        </div>
      ),
      { width: 900, height }
    );

    await logApiUsage(keyId, user.userId, SERVICE, 'GET', 200, ip);
    return image;
  } catch (error: any) {
    return err(error?.message || 'Gagal membuat gambar codesnap', 500);
  }
}
