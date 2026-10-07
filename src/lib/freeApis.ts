import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT = 12000;

let countryCache: { time: number; list: any[] } | null = null;
let namaCache: any[] | null = null;

function paramError(message: string, status = 400): never {
  const err: any = new Error(message);
  err.status = status;
  err.publicMessage = true;
  throw err;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const NGL_SUBMIT = 'https://ngl.link/api/submit';
const NGL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Terima https://ngl.link/username, https://username.ngl.link, atau slug polos
function extractNglUsername(input: string): string | null {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (!raw.includes('.')) return /^[a-z0-9._-]{2,40}$/i.test(raw) ? raw : null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'ngl.link') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (host.endsWith('.ngl.link')) return host.slice(0, -'.ngl.link'.length) || null;
    return null;
  } catch {
    return null;
  }
}

async function submitNgl(username: string, question: string): Promise<string> {
  const res = await fetch(NGL_SUBMIT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': NGL_UA },
    body: JSON.stringify({ username, question, gameId: '4' }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const body: any = await res.json().catch(() => null);
  if (!res.ok || !body || !body.questionId) throw new Error('API_UNAVAILABLE');
  return String(body.questionId);
}

const FREE_APIS: Record<string, (params: URLSearchParams) => Promise<any>> = {

  '/api/random/waifu': async () => {
    const res = await fetch('https://nekos.life/api/v2/img/waifu', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { url: data.url, source: 'nekos.life' } };
  },

  '/api/random/loli': async () => {
    const res = await fetch('https://nekos.life/api/v2/img/waifu', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { url: data.url, source: 'nekos.life' } };
  },

  '/api/random/meme': async () => {
    const res = await fetch('https://meme-api.com/gimme', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { title: data.title, url: data.url, postLink: data.postLink, subreddit: data.subreddit, nsfw: data.nsfw, ups: data.ups } };
  },

  '/api/random/pantun': async () => {
    const pantun = [
      { sapa: 'Makan nasi di piring\nMinum teh di gelas', jawab: 'Kalau sayang sama saya\nJanganlah suka rewel' },
      { sapa: 'Hujan turun ke bumi\nBasah semua ke tanah', jawab: 'Kalau sayang sama saya\nJangan suka membual sahaja' },
      { sapa: 'Pergi ke pasar beli ikan\nPulang-pulang masak gulai', jawab: 'Kalau sayang janganlah tipu\nYang ikhlas itu pasti' },
      { sapa: 'Beli kain di Tanah Abang\nWarnanya sangat merah', jawab: 'Kalau jodoh tak akan kemana\nTak jodoh sudahlah jua' },
      { sapa: 'Makan bubur pakai gula\nSedap rasanya manis-manis', jawab: 'Berkawan baik janganlah bermusuh\nMati pun saling menangis' },
      { sapa: 'Jalan-jalan ke Bandung\nMembeli kain sutera', jawab: 'Sudah kenal bertahun-tahun\nBaru tahu hati berkaca-kaca' },
      { sapa: 'Ke dapur masak gulai\nGulai dimakan dengan roti', jawab: 'Hati bersedih tak berlagu\nBiarlah jadi rahsia di hati' },
    ];
    const p = pantun[Math.floor(Math.random() * pantun.length)];
    return { status: true, creator: 'mazval', result: p };
  },

  '/api/random/quote-bucin': async () => {
    const quotes = [
      { quote: 'Aku mencintaimu bukan karena kamu sempurna, tapi karena kamu menjadi sempurna bagiku.', author: 'Anonymous' },
      { quote: 'Cinta yang tulus akan selalu menemukan jalannya kembali.', author: 'Anonymous' },
      { quote: 'Kamu adalah alasan aku tersenyum setiap hari.', author: 'Anonymous' },
      { quote: 'Aku lebih memilih menjadi orang kedua dalam hidupmu, daripada menjadi orang asing.', author: 'Anonymous' },
      { quote: 'Ketika aku melihatmu, aku merasa Tuhan sedang tersenyum padaku.', author: 'Anonymous' },
      { quote: 'Cinta itu sederhana, kamu hanya perlu percaya satu hal: kita berdua.', author: 'Anonymous' },
      { quote: 'Aku tak butuh mata untuk melihatmu, cukup hatiku yang merindukanmu.', author: 'Anonymous' },
      { quote: 'Jika aku memilihmu, itu bukan karena pilihan lain tak ada, tapi karena aku tahu kamu yang terbaik.', author: 'Anonymous' },
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    return { status: true, creator: 'mazval', result: q };
  },

  '/api/random/tebaktebakan': async () => {
    const tebakan = [
      { q: 'Apa yang ada di tengah kota?', a: 'Huruf T' },
      { q: 'Apa yang bisa naik tapi tidak pernah turun?', a: 'Usia' },
      { q: 'Apa yang pecah jika kamu namanya?', a: 'Keheningan' },
      { q: 'Apa yang memiliki kaki tapi tidak bisa berjalan?', a: 'Meja' },
      { q: 'Apa yang bisa kamu pecahkan tanpa menyentuhnya?', a: 'Janji' },
      { q: 'Apa yang selalu basah tapi tidak pernah mandi?', a: 'Pensil' },
      { q: 'Benda apa yang bisa masuk tanpa harus keluar?', a: 'Password' },
      { q: 'Apa yang bisa berjalan tanpa kaki?', a: 'Air / sungai' },
    ];
    const t = tebakan[Math.floor(Math.random() * tebakan.length)];
    return { status: true, creator: 'mazval', result: t };
  },

  '/api/random/tekateki': async () => {
    const teka = [
      { q: 'Benda apa yang selalu basah saat digunakan?', a: 'Sikat gigi' },
      { q: 'Apa yang memiliki mulut tapi tidak bisa bicara?', a: 'Sungai' },
      { q: 'Apa yang bisa berlari tanpa kaki?', a: 'Air' },
      { q: 'Apa yang selalu naik tapi tidak pernah turun?', a: 'Jalan rusak' },
      { q: 'Benda apa yang semakin panjang semakin pendek?', a: 'Bayangan' },
      { q: 'Apa yang bisa masuk ke mana saja tapi tidak pernah keluar?', a: 'Kunci' },
    ];
    const t = teka[Math.floor(Math.random() * teka.length)];
    return { status: true, creator: 'mazval', result: t };
  },

  '/api/random/asahotak': async () => {
    const pertanyaan = [
      { q: 'Apa yang bisa terbang tanpa sayap?', a: 'Waktu' },
      { q: 'Apa yang selalu basah tapi tidak pernah basah?', a: 'Pensil' },
      { q: 'Apa yang memiliki mata tapi tidak bisa melihat?', a: 'Jarum' },
      { q: 'Apa yang bisa masuk tanpa harus keluar?', a: 'Password' },
      { q: 'Apa yang pecah jika namanya disebut?', a: 'Keheningan' },
      { q: 'Apa yang memiliki kaki tapi tidak bisa berjalan?', a: 'Meja' },
    ];
    const p = pertanyaan[Math.floor(Math.random() * pertanyaan.length)];
    return { status: true, creator: 'mazval', result: p };
  },

  '/api/random/papayang': async () => {
    const res = await fetch('https://meme-api.com/gimme', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { title: data.title, url: data.url, postLink: data.postLink } };
  },

  '/api/download/youtube': async (params) => {
    const url = params.get('url');
    if (!url) return { status: false, creator: 'mazval', message: 'Parameter url diperlukan' };
    const videoId = extractYouTubeId(url);
    if (!videoId) return { status: false, creator: 'mazval', message: 'URL YouTube tidak valid' };
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { signal: AbortSignal.timeout(TIMEOUT) });
      if (res.ok) {
        const info = await res.json();
        return {
          status: true, creator: 'mazval',
          result: {
            title: info.title, author: info.author_name, author_url: info.author_url,
            thumbnail: info.thumbnail_url, video_id: videoId,
            download: {
              mp4: `https://cobalt.tools/api/download?id=${videoId}&format=mp4`,
              mp3: `https://cobalt.tools/api/download?id=${videoId}&format=mp3`,
              note: 'Gunakan cobalt.tools untuk download',
              cobalt_url: 'https://cobalt.tools',
            },
            url: `https://www.youtube.com/watch?v=${videoId}`,
          }
        };
      }
    } catch {}
    return { status: true, creator: 'mazval', result: { video_id: videoId, url, download: { cobalt_url: 'https://cobalt.tools' } } };
  },

  '/api/download/tiktok': async (params) => {
    const url = params.get('url');
    if (!url) return { status: false, creator: 'mazval', message: 'Parameter url diperlukan' };
    return { status: true, creator: 'mazval', result: { url, download: { cobalt_url: 'https://cobalt.tools', note: 'Paste URL TikTok di cobalt.tools' } } };
  },

  '/api/download/facebook': async (params) => {
    const url = params.get('url');
    if (!url) return { status: false, creator: 'mazval', message: 'Parameter url diperlukan' };
    return { status: true, creator: 'mazval', result: { url, download: { cobalt_url: 'https://cobalt.tools', note: 'Paste URL Facebook di cobalt.tools' } } };
  },

  '/api/download/instagram': async (params) => {
    const url = params.get('url');
    if (!url) return { status: false, creator: 'mazval', message: 'Parameter url diperlukan' };
    return { status: true, creator: 'mazval', result: { url, download: { cobalt_url: 'https://cobalt.tools', note: 'Paste URL Instagram di cobalt.tools' } } };
  },

  '/api/download/twitter': async (params) => {
    const url = params.get('url');
    if (!url) return { status: false, creator: 'mazval', message: 'Parameter url diperlukan' };
    return { status: true, creator: 'mazval', result: { url, download: { cobalt_url: 'https://cobalt.tools', note: 'Paste URL Twitter/X di cobalt.tools' } } };
  },

  '/api/download/spotify': async (params) => {
    const url = params.get('url');
    if (!url) return { status: false, creator: 'mazval', message: 'Parameter url diperlukan' };
    return { status: true, creator: 'mazval', result: { url, download: { note: 'Spotify download tersedia via third-party tools' } } };
  },

  '/api/tools/translate': async (params) => {
    const text = params.get('text') || params.get('q') || '';
    const to = params.get('id') || params.get('to') || params.get('target') || 'id';
    const from = params.get('from') || params.get('source') || 'en';
    if (!text) return { status: false, creator: 'mazval', message: 'Parameter text diperlukan' };
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { translation: data.responseData?.translatedText, source: from, target: to, match: data.responseData?.match } };
  },

  '/api/tools/qr-create': async (params) => {
    const text = params.get('text') || params.get('data') || params.get('q') || 'hello';
    const size = params.get('size') || '300x300';
    return { status: true, creator: 'mazval', result: { url: `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(text)}`, text, size } };
  },

  '/api/tools/ssweb': async (params) => {
    const url = params.get('url') || 'https://google.com';
    if (!url.startsWith('http')) return { status: false, creator: 'mazval', message: 'URL harus diawali http/https' };
    return { status: true, creator: 'mazval', result: { url: `https://image.thum.io/get/width/1200/crop/800/${url}`, target: url } };
  },

  // Pesan anonim NGL: kirim satu pertanyaan ke link NGL milik pengguna
  '/api/tools/ngl': async (params) => {
    const rawLink = (params.get('link') || params.get('url') || '').trim();
    const text = (params.get('text') || params.get('pesan') || params.get('message') || '').trim();
    if (!rawLink) throw paramError('Parameter link wajib diisi. Contoh: ?link=https://ngl.link/username&text=halo', 400);
    if (!text) throw paramError('Parameter text wajib diisi. Contoh: ?link=https://ngl.link/username&text=halo', 400);
    const username = extractNglUsername(rawLink);
    if (!username) throw paramError('Link NGL tidak valid. Contoh: https://ngl.link/username', 400);

    const questionId = await submitNgl(username, text);
    return {
      status: true,
      creator: 'mazval',
      result: {
        link: `https://ngl.link/${username}`,
        username,
        pesan: text,
        question_id: questionId,
        terkirim: 1,
        sumber: 'ngl.link',
      },
    };
  },

  // Pesan anonim NGL berulang: jumlah dibatasi 10x supaya tidak menyalahgunakan layanan
  '/api/tools/ngl-spam': async (params) => {
    const rawLink = (params.get('link') || params.get('url') || '').trim();
    const pesan = (params.get('pesan') || params.get('text') || params.get('message') || '').trim();
    if (!rawLink) throw paramError('Parameter link wajib diisi. Contoh: ?link=https://ngl.link/username&pesan=halo&jumlah=5', 400);
    if (!pesan) throw paramError('Parameter pesan wajib diisi. Contoh: ?link=https://ngl.link/username&pesan=halo&jumlah=5', 400);
    const username = extractNglUsername(rawLink);
    if (!username) throw paramError('Link NGL tidak valid. Contoh: https://ngl.link/username', 400);

    let jumlah = parseInt(params.get('jumlah') || '5', 10);
    if (!Number.isFinite(jumlah) || jumlah < 1) jumlah = 5;
    jumlah = Math.min(jumlah, 10);

    const hasil = await Promise.allSettled(
      Array.from({ length: jumlah }, () => submitNgl(username, pesan)),
    );
    const idList = hasil.filter((h) => h.status === 'fulfilled').map((h) => (h as PromiseFulfilledResult<string>).value);
    if (idList.length === 0) throw new Error('API_UNAVAILABLE');

    return {
      status: true,
      creator: 'mazval',
      result: {
        link: `https://ngl.link/${username}`,
        username,
        pesan,
        jumlah_diminta: jumlah,
        terkirim: idList.length,
        gagal: jumlah - idList.length,
        sumber: 'ngl.link',
      },
    };
  },

  '/api/tools/currency': async (params) => {
    const from = (params.get('from') || 'USD').toUpperCase();
    const to = (params.get('to') || 'IDR').toUpperCase();
    const amount = parseFloat(params.get('amount') || '1');
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    const rate = data.rates?.[to];
    if (!rate) return { status: false, creator: 'mazval', message: `Currency ${to} tidak ditemukan. Tersedia: ${Object.keys(data.rates || {}).join(', ')}` };
    return { status: true, creator: 'mazval', result: { from, to, amount, rate, result: parseFloat((amount * rate).toFixed(2)), date: data.date } };
  },

  '/api/tools/ip-lookup': async (params) => {
    const ip = params.get('ip') || params.get('query') || '';
    if (!ip) return { status: false, creator: 'mazval', message: 'Parameter ip diperlukan' };
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    if (data.success === false) return { status: false, creator: 'mazval', message: data.message || 'IP tidak valid' };
    return { status: true, creator: 'mazval', result: { ip: data.ip, type: data.type, city: data.city, region: data.region, country: data.country, country_code: data.country_code, latitude: data.latitude, longitude: data.longitude, org: data.connection?.org, isp: data.connection?.isp, asn: data.connection?.asn, timezone: data.timezone?.id, utc: data.timezone?.utc, flag: data.flag?.emoji } };
  },

  '/api/tools/npmjs': async (params) => {
    const pkg = params.get('package') || params.get('q') || params.get('query') || '';
    if (!pkg) return { status: false, creator: 'mazval', message: 'Parameter package diperlukan' };
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return { status: false, creator: 'mazval', message: `Package "${pkg}" tidak ditemukan` };
    const data = await res.json();
    const latest = data['dist-tags']?.latest || 'unknown';
    const time = data.time?.[latest] || '';
    return { status: true, creator: 'mazval', result: { name: data.name, version: latest, description: data.description, author: data.author?.name || data.maintainers?.[0]?.name || 'unknown', license: data.license, homepage: data.homepage || data.repository?.url, created: data.time?.created, modified: time } };
  },

  '/api/info/crypto': async (params) => {
    const aliases: Record<string, 'BTC' | 'ETH' | 'SOL' | 'DOGE' | 'BNB'> = {
      btc: 'BTC', bitcoin: 'BTC', eth: 'ETH', ethereum: 'ETH',
      sol: 'SOL', solana: 'SOL', doge: 'DOGE', dogecoin: 'DOGE',
      bnb: 'BNB', binancecoin: 'BNB',
    };
    const coin = (params.get('coin') || '').trim().toLowerCase();
    if (coin && !aliases[coin]) throw paramError(`Koin "${params.get('coin')}" tidak tersedia. Pilihan: BTC, ETH, SOL, DOGE, BNB`, 404);

    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,binancecoin&vs_currencies=usd,idr', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    const all: Record<string, { usd: number; idr: number }> = {
      BTC: { usd: data.bitcoin?.usd, idr: data.bitcoin?.idr },
      ETH: { usd: data.ethereum?.usd, idr: data.ethereum?.idr },
      SOL: { usd: data.solana?.usd, idr: data.solana?.idr },
      DOGE: { usd: data.dogecoin?.usd, idr: data.dogecoin?.idr },
      BNB: { usd: data.binancecoin?.usd, idr: data.binancecoin?.idr },
    };

    if (!coin) return { status: true, creator: 'mazval', result: all };
    const key = aliases[coin];
    return { status: true, creator: 'mazval', result: { [key]: all[key] } };
  },

  '/api/info/gempa': async () => {
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    const g = data.Infogempa?.gempa;
    if (!g) return { status: false, creator: 'mazval', message: 'Data gempa tidak tersedia' };
    return { status: true, creator: 'mazval', result: { tanggal: g.Tanggal, jam: g.Jam, magnitude: g.Magnitude, kedalaman: g.Kedalaman, wilayah: g.Wilayah, koordinat: g.Coordinates, potensi: g.Potensi, dirasakan: g.Dirasakan, shakemap: g.Shakemap } };
  },

  '/api/info/cuaca': async (params) => {
    const kota = params.get('kota') || params.get('q') || params.get('location') || 'Jakarta';
    const res = await fetch(`https://wttr.in/${encodeURIComponent(kota)}?format=j1`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    const c = data.current_condition?.[0];
    const w = data.weather?.[0];
    return { status: true, creator: 'mazval', result: { kota, suhu_c: c?.temp_C, suhu_f: c?.temp_F, kelembaban: c?.humidity, deskripsi: c?.weatherDesc?.[0]?.value, angin_kmph: c?.windspeedKmph, angin_arah: c?.winddir16Point, curah_hujan_mm: c?.precipMM, visibilitas_km: c?.visibility, hari_ini: w ? { max: w.maxtempC, min: w.mintempC, sunrise: w.astronomy?.[0]?.sunrise, sunset: w.astronomy?.[0]?.sunset } : null } };
  },

  '/api/info/lyrics': async (params) => {
    const q = params.get('q') || params.get('query') || params.get('song') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter q diperlukan' };
    const res = await fetch(`https://api.lyrics.ovh/v1/search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return { status: false, creator: 'mazval', message: 'Lyrics tidak ditemukan' };
    const data = await res.json();
    const first = data.data?.[0];
    return { status: true, creator: 'mazval', result: { title: first?.title, artist: first?.artist?.name, album: first?.album?.title, preview: first?.preview, link: first?.link } };
  },

  '/api/stalk/github': async (params) => {
    const user = params.get('user') || params.get('username') || '';
    if (!user) return { status: false, creator: 'mazval', message: 'Parameter user diperlukan' };
    const res = await fetch(`https://api.github.com/users/${user}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return { status: false, creator: 'mazval', message: 'User tidak ditemukan' };
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { username: data.login, name: data.name, bio: data.bio, avatar: data.avatar_url, html_url: data.html_url, repos: data.public_repos, gists: data.public_gists, followers: data.followers, following: data.following, company: data.company, location: data.location, blog: data.blog, created: data.created_at, twitter: data.twitter_username } };
  },

  '/api/stalk/twitter': async (params) => {
    const user = params.get('user') || params.get('username') || '';
    if (!user) return { status: false, creator: 'mazval', message: 'Parameter user diperlukan' };
    return { status: true, creator: 'mazval', result: { username: user, profile_url: `https://x.com/${user}`, note: 'Data Twitter/X terbatas karena API berbayar' } };
  },

  '/api/stalk/youtube': async (params) => {
    const channel = params.get('channel') || params.get('url') || params.get('user') || params.get('username') || '';
    if (!channel) return { status: false, creator: 'mazval', message: 'Parameter channel/user diperlukan' };
    return { status: true, creator: 'mazval', result: { channel, search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`, note: 'YouTube channel info via search' } };
  },

  '/api/stalk/pinterest': async (params) => {
    const user = params.get('user') || params.get('username') || params.get('q') || '';
    if (!user) return { status: false, creator: 'mazval', message: 'Parameter user diperlukan' };
    return { status: true, creator: 'mazval', result: { username: user, profile_url: `https://www.pinterest.com/${user}/`, search_url: `https://www.pinterest.com/search/pins/?q=${user}` } };
  },

  '/api/stalk/threads': async (params) => {
    const user = params.get('user') || params.get('username') || params.get('q') || '';
    if (!user) return { status: false, creator: 'mazval', message: 'Parameter user diperlukan' };
    return { status: true, creator: 'mazval', result: { username: user, profile_url: `https://www.threads.net/@${user}` } };
  },

  '/api/s/youtube': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&format=json`, { signal: AbortSignal.timeout(TIMEOUT) }).catch(() => null);
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, watch_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` } };
  },

  '/api/s/pinterest': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    const type = (params.get('type') || '').trim();
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}${type ? `&type=${encodeURIComponent(type)}` : ''}`;
    return { status: true, creator: 'mazval', result: { query: q, type: type || null, search_url: url } };
  },

  '/api/s/brave': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://search.brave.com/search?q=${encodeURIComponent(q)}` } };
  },

  '/api/s/duckduckgo': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    const kl = (params.get('kl') || '').trim();
    const df = (params.get('df') || '').trim();
    const extra = `${kl ? `&kl=${encodeURIComponent(kl)}` : ''}${df ? `&df=${encodeURIComponent(df)}` : ''}`;
    return { status: true, creator: 'mazval', result: { query: q, kl: kl || null, df: df || null, search_url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}${extra}` } };
  },

  '/api/s/applemusic': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    const region = (params.get('region') || '').trim().toUpperCase();
    const extra = region ? `&cc=${encodeURIComponent(region)}` : '';
    return { status: true, creator: 'mazval', result: { query: q, region: region || null, search_url: `https://music.apple.com/search?term=${encodeURIComponent(q)}${extra}` } };
  },

  '/api/s/bimg': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://www.bing.com/images/search?q=${encodeURIComponent(q)}` } };
  },

  '/api/sticker/stickerly': async (params) => {
    const q = params.get('q') || params.get('query') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter q diperlukan' };
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://www.stickerly.com/search/${encodeURIComponent(q)}` } };
  },

  '/api/image/brat': async (params) => {
    const text = params.get('text') || params.get('q') || 'hello';
    return { status: true, creator: 'mazval', result: { url: `https://api.brattxt.xyz/?text=${encodeURIComponent(text)}`, text } };
  },

  '/api/image/brathd': async (params) => {
    const text = params.get('text') || params.get('q') || 'hello';
    return { status: true, creator: 'mazval', result: { url: `https://api.brattxt.xyz/?text=${encodeURIComponent(text)}&hd=true`, text } };
  },

  '/api/r/quotesanime': async () => {
    const quotes = [
      { quote: 'Tidak ada yang mustahil kalau kita mau berusaha.', anime: 'Naruto' },
      { quote: 'Jangan pernah menyerah, karena menyerah adalah kekalahan sejati.', anime: 'One Piece' },
      { quote: 'Hanya orang bodoh yang menyerah pada keadaan.', anime: 'Black Clover' },
      { quote: 'Kekuatan sejati bukan dari tubuh, tapi dari hati.', anime: 'Fairy Tail' },
      { quote: 'Mimpi bukan sesuatu yang kamu lihat saat tidur, mimpi adalah sesuatu yang tidak membiarkan kamu tidur.', anime: 'Naruto' },
      { quote: 'Jika kamu tidak bisa melindungi orang yang kamu sayangi, maka kamu tidak pantas hidup.', anime: 'One Piece' },
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    return { status: true, creator: 'mazval', result: q };
  },

  '/api/r/lahelu': async () => {
    const res = await fetch('https://meme-api.com/gimme', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { title: data.title, url: data.url } };
  },

  '/api/info/jadwal-sholat': async (params) => {
    const kota = (params.get('kota') || params.get('city') || '').trim();
    if (!kota) throw paramError('Parameter kota wajib diisi. Contoh: ?kota=Jakarta');
    const method = Number(params.get('method')) || 2;
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(kota)}&country=Indonesia&method=${method}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    if (body?.code !== 200 || !body?.data?.timings) throw new Error('API_UNAVAILABLE');
    return {
      status: true,
      creator: 'mazval',
      result: {
        kota,
        method,
        tanggal: body.data.date?.readable,
        hijri: body.data.date?.hijri,
        jadwal: body.data.timings,
        sumber: 'Aladhan API',
      },
    };
  },

  '/api/info/doa': async (params) => {
    const q = (params.get('q') || params.get('query') || '').trim();
    if (!q) throw paramError('Parameter q wajib diisi. Contoh: ?q=subuh');
    const res = await fetch('https://api.myquran.com/v2/doa/semua', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    const list: any[] = Array.isArray(body?.data) ? body.data : [];
    const needle = q.toLowerCase();
    const hasil = list.filter(d =>
      String(d.judul || '').toLowerCase().includes(needle) ||
      String(d.artinya || '').toLowerCase().includes(needle)
    ).slice(0, 10);
    if (hasil.length === 0) throw paramError(`Doa dengan kata "${q}" tidak ditemukan`, 404);
    return { status: true, creator: 'mazval', result: { query: q, total: hasil.length, data: hasil, sumber: 'MyQuran API' } };
  },

  '/api/info/jadwal-bola': async (params) => {
    const tanggal = params.get('date') || new Date().toISOString().slice(0, 10);
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${tanggal}&s=Soccer`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    const data = events.slice(0, 40).map((e: any) => ({
      id: e.idEvent,
      liga: e.strLeague,
      pertandingan: e.strEvent,
      tanggal: e.dateEvent,
      jam: e.strTime,
      status: e.strStatus,
      stadion: e.strVenue,
    }));
    return { status: true, creator: 'mazval', result: { tanggal, total: data.length, data, sumber: 'TheSportsDB' } };
  },

  '/api/tools/kodepos': async (params) => {
    const q = (params.get('form') || params.get('kode') || params.get('search') || params.get('q') || '').trim();
    if (!q) throw paramError('Parameter form wajib diisi. Contoh: ?form=40123 atau ?form=menteng');
    const res = await fetch(`https://carikodepos.id/api/postal-codes?search=${encodeURIComponent(q)}&limit=20`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    const rows: any[] = body?.data?.postalCodes || [];
    const data = rows.map((r: any) => ({
      kodepos: r.code,
      desa: r.village?.name,
      kecamatan: r.district?.name,
      kota: r.city?.name,
      provinsi: r.province?.name,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
    if (data.length === 0) throw paramError(`Kode pos atau wilayah "${q}" tidak ditemukan`, 404);
    return { status: true, creator: 'mazval', result: { query: q, total: data.length, data, sumber: 'CariKodePos.ID' } };
  },

  '/api/tools/subdomains': async (params) => {
    const domain = (params.get('domain') || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !domain.includes('.')) throw paramError('Parameter domain wajib diisi. Contoh: ?domain=example.com');
    const res = await fetch(`https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names&match_wildcards=true&expand=dns_names`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    const names = new Set<string>();
    for (const item of Array.isArray(body) ? body : []) {
      for (const n of item.dns_names || []) {
        const host = String(n).replace(/^\*\./, '').toLowerCase();
        if (host === domain || host.endsWith('.' + domain)) names.add(host);
      }
    }
    const data = Array.from(names).sort();
    return { status: true, creator: 'mazval', result: { domain, total: data.length, data, sumber: 'Cert Spotter (SSL Transparency Log)' } };
  },

  '/api/info/jarakkota': async (params) => {
    const dari = (params.get('dari') || params.get('from') || params.get('kota1') || '').trim();
    const ke = (params.get('ke') || params.get('to') || params.get('kota2') || '').trim();
    if (!dari || !ke) throw paramError('Parameter dari dan ke wajib diisi. Contoh: ?dari=Jakarta&ke=Bandung');

    async function geocode(city: string): Promise<{ nama: string; lat: number; lon: number }> {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=Indonesia&format=json&limit=1`, {
        headers: { 'User-Agent': 'mazvall-api/1.0' },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) throw new Error('API_UNAVAILABLE');
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) throw paramError(`Lokasi "${city}" tidak ditemukan`, 404);
      return { nama: rows[0].display_name, lat: Number(rows[0].lat), lon: Number(rows[0].lon) };
    }

    const a = await geocode(dari);
    await new Promise(r => setTimeout(r, 1100));
    const b = await geocode(ke);

    const R = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    const jarak = 2 * R * Math.asin(Math.sqrt(h));

    return {
      status: true,
      creator: 'mazval',
      result: {
        dari: { kota: dari, lokasi: a.nama, latitude: a.lat, longitude: a.lon },
        ke: { kota: ke, lokasi: b.nama, latitude: b.lat, longitude: b.lon },
        jarak_km: Math.round(jarak * 100) / 100,
        metode: 'Haversine (koordinat OpenStreetMap Nominatim)',
      },
    };
  },

  '/api/tools/domain-recon': async (params) => {
    const domain = (params.get('domain') || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !domain.includes('.')) throw paramError('Parameter domain wajib diisi. Contoh: ?domain=example.com');

    async function dnsLookup(type: string) {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const body = await res.json();
      return (body.Answer || []).map((a: any) => a.data).filter(Boolean);
    }

    const [a, aaaa, mx, ns, txt, rdap, sub] = await Promise.allSettled([
      dnsLookup('A'), dnsLookup('AAAA'), dnsLookup('MX'), dnsLookup('NS'), dnsLookup('TXT'),
      (async () => {
        const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { headers: { Accept: 'application/rdap+json, application/json' }, signal: AbortSignal.timeout(10000), redirect: 'follow' });
        if (!res.ok) return null;
        const body = await res.json();
        return {
          handle: body.handle,
          registrar: body.registrarName || body.entities?.[0]?.vcardArray?.[1]?.find((x: any) => x[0] === 'fn')?.[3],
          statuses: body.status,
          created: body.events?.find((e: any) => e.eventAction === 'registration')?.eventDate,
          expires: body.events?.find((e: any) => e.eventAction === 'expiration')?.eventDate,
          nameservers: (body.nameservers || []).map((n: any) => n.ldhName).filter(Boolean),
        };
      })(),
      (async () => {
        const res = await fetch(`https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return [];
        const body = await res.json();
        const names = new Set<string>();
        for (const item of Array.isArray(body) ? body : []) {
          for (const n of item.dns_names || []) {
            const host = String(n).replace(/^\*\./, '').toLowerCase();
            if (host === domain || host.endsWith('.' + domain)) names.add(host);
          }
        }
        return Array.from(names).sort();
      })(),
    ]);

    const val = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value : null);
    return {
      status: true,
      creator: 'mazval',
      result: {
        domain,
        dns: { a: val(a), aaaa: val(aaaa), mx: val(mx), ns: val(ns), txt: val(txt) },
        whois: val(rdap),
        subdomains: val(sub) || [],
        sumber: 'DNS-over-HTTPS Google, RDAP, Cert Spotter',
      },
    };
  },

  '/api/tools/countryInfo': async (params) => {
    const name = (params.get('name') || params.get('country') || '').trim();
    if (!name) throw paramError('Parameter name wajib diisi. Contoh: ?name=Indonesia');

    let cache = countryCache;
    if (!cache || Date.now() - cache.time > 6 * 60 * 60 * 1000) {
      const res = await fetch('https://api.worldbank.org/v2/country?format=json&per_page=400', { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error('API_UNAVAILABLE');
      const body = await res.json();
      if (!Array.isArray(body?.[1])) throw new Error('API_UNAVAILABLE');
      cache = { time: Date.now(), list: body[1] };
      countryCache = cache;
    }

    const needle = name.toLowerCase();
    const found = cache.list.find((c: any) => String(c.name).toLowerCase() === needle)
      || cache.list.find((c: any) => String(c.name).toLowerCase().includes(needle))
      || cache.list.find((c: any) => String(c.iso2Code).toLowerCase() === needle);
    if (!found) throw paramError(`Negara "${name}" tidak ditemukan`, 404);

    return {
      status: true,
      creator: 'mazval',
      result: {
        nama: found.name,
        kode: found.iso2Code,
        id: found.id,
        ibu_kota: found.capitalCity,
        kawasan: found.region?.value,
        kawasan_administratif: found.adminregion?.value || null,
        tingkat_pendapatan: found.incomeLevel?.value,
        koordinat: found.latitude && found.longitude ? { latitude: Number(found.latitude), longitude: Number(found.longitude) } : null,
        sumber: 'World Bank API',
      },
    };
  },

  '/api/tools/cek-nomor': async (params) => {
    const nomor = (params.get('nomor') || params.get('phone') || params.get('number') || '').trim();
    if (!nomor) throw paramError('Parameter nomor wajib diisi. Contoh: ?nomor=081234567890');

    const digits = nomor.replace(/[\s\-().+]/g, '').replace(/^62/, '0');
    if (!/^0\d{8,12}$/.test(digits)) {
      throw paramError('Format nomor tidak valid. Gunakan format 08xx atau 628xx');
    }

    const operatorPrefixes: Record<string, string[]> = {
      'Telkomsel': ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'],
      'Indosat': ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
      'XL': ['0817', '0818', '0819', '0859', '0877', '0878'],
      'Axis': ['0831', '0832', '0833', '0838'],
      'Tri': ['0895', '0896', '0897', '0898', '0899'],
      'Smartfren': ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
    };

    const prefix4 = digits.slice(0, 4);
    let operator: string | null = null;
    for (const [op, prefixes] of Object.entries(operatorPrefixes)) {
      if (prefixes.includes(prefix4)) { operator = op; break; }
    }

    return {
      status: true,
      creator: 'mazval',
      result: {
        nomor_asli: nomor,
        nomor_normal: digits,
        format_valid: true,
        panjang: digits.length,
        prefix: prefix4,
        operator,
        keterangan: operator
          ? `Berdasarkan awalan nomor, kemungkinan besar menggunakan jaringan ${operator}.`
          : 'Awalan nomor tidak dikenali pada basis prefix operator umum Indonesia.',
        catatan: 'Status aktif/nonaktif nomor tidak dapat diverifikasi tanpa akses ke sistem operator.',
      },
    };
  },

  '/api/s/myinstants': async (params) => {
    const q = (params.get('q') || params.get('query') || '').trim();
    const url = q
      ? `https://myinstants-api.vercel.app/search?q=${encodeURIComponent(q)}`
      : 'https://myinstants-api.vercel.app/trending?q=id';
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { query: q || 'trending', data, sumber: 'MyInstants' } };
  },

  '/api/tools/qr-detect': async (params) => {
    const url = (params.get('url') || params.get('link') || '').trim();
    if (!url) throw paramError('Parameter url wajib diisi. Contoh: ?url=https://example.com/qr.png');
    const img = await fetch(url, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!img || !img.ok) throw paramError('Gambar tidak dapat diunduh dari url tersebut', 400);
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length === 0) throw paramError('Gambar kosong atau tidak valid', 400);
    if (buf.length > 5_000_000) throw paramError('Ukuran gambar maksimal 5MB', 400);

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(buf)], { type: img.headers.get('content-type') || 'image/png' }), 'qr.png');
    const res = await fetch('https://api.qrserver.com/v1/read-qr-code/', { method: 'POST', body: form, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    const symbols: any[] = (Array.isArray(body) ? body : []).flatMap((item: any) => item.symbol || []);
    const found = symbols.filter((s: any) => s.data);
    if (found.length === 0) throw paramError('Tidak ditemukan QR code yang terbaca pada gambar tersebut', 404);
    return {
      status: true,
      creator: 'mazval',
      result: { url, total: found.length, data: found.map((s: any) => ({ isi: s.data, error: s.error })), sumber: 'goQR.me API' },
    };
  },

  '/api/sticker/combot-search': async (params) => {
    const q = (params.get('q') || params.get('query') || '').trim();
    if (!q) throw paramError('Parameter q wajib diisi. Contoh: ?q=cats');
    const page = Math.max(1, Number(params.get('page')) || 1);
    const res = await fetch(`https://combot.org/stickers?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ''}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const html = await res.text();
    const ldBlocks = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || [];
    let items: any[] = [];
    for (const block of ldBlocks) {
      try {
        const d = JSON.parse(block.replace(/^<script type="application\/ld\+json">/, '').replace(/<\/script>$/, ''));
        const graphs: any[] = Array.isArray(d?.['@graph']) ? d['@graph'] : [d];
        for (const g of graphs) {
          if (g?.['@type'] !== 'CollectionPage') continue;
          const list = g?.mainEntity?.itemListElement;
          if (Array.isArray(list) && list.length > 0) {
            items = list.map((li: any) => ({ nama: li.name, url: li.url }));
          }
        }
      } catch { /* lanjut blok berikutnya */ }
    }
    if (items.length === 0) throw paramError(`Paket sticker dengan kata "${q}" tidak ditemukan`, 404);
    return { status: true, creator: 'mazval', result: { query: q, page, total: items.length, data: items, sumber: 'Combot.org' } };
  },

  '/api/s/mcpedl': async (params) => {
    const q = (params.get('q') || params.get('query') || '').trim();
    if (!q) throw paramError('Parameter q wajib diisi. Contoh: ?q=shaders');
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://mcpedl.com/search/?search=${encodeURIComponent(q)}` } };
  },

  '/api/s/mangatoon': async (params) => {
    const q = (params.get('query') || params.get('q') || '').trim();
    if (!q) throw paramError('Parameter query wajib diisi. Contoh: ?query=solo%20leveling');
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://mangatoon.mobi/en/search?word=${encodeURIComponent(q)}` } };
  },

  '/api/s/otakotaku': async (params) => {
    const q = (params.get('query') || params.get('q') || '').trim();
    if (!q) throw paramError('Parameter query wajib diisi. Contoh: ?query=mahiru');
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://otakotaku.com/?s=${encodeURIComponent(q)}` } };
  },

  '/api/s/8font': async (params) => {
    const q = (params.get('query') || params.get('q') || '').trim();
    if (!q) throw paramError('Parameter query wajib diisi. Contoh: ?query=cartoon');
    const page = Math.max(1, Number(params.get('page')) || 1);
    const url = `https://8font.com/?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ''}`;
    return { status: true, creator: 'mazval', result: { query: q, page, search_url: url } };
  },

  '/api/s/gitagram': async (params) => {
    const q = (params.get('search') || params.get('q') || '').trim();
    if (!q) throw paramError('Parameter search wajib diisi. Contoh: ?search=sekuat%20hatimu');
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://gitagram.com/?s=${encodeURIComponent(q)}` } };
  },

  '/api/s/lahelu': async (params) => {
    const q = (params.get('query') || params.get('q') || '').trim();
    if (!q) throw paramError('Parameter query wajib diisi. Contoh: ?query=drakor');
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://lahelu.com/?query=${encodeURIComponent(q)}` } };
  },

  '/api/tools/ocr': async (params) => {
    const url = (params.get('url') || params.get('image') || '').trim();
    if (!url) throw paramError('Parameter url wajib diisi. Contoh: ?url=https://example.com/gambar.png');
    const img = await fetch(url, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!img || !img.ok) throw paramError('Gambar tidak dapat diunduh dari url tersebut', 400);
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length === 0) throw paramError('Gambar kosong atau tidak valid', 400);
    if (buf.length > 5_000_000) throw paramError('Ukuran gambar maksimal 5MB', 400);

    const ctype = (img.headers.get('content-type') || 'image/png').split(';')[0];
    const extMap: Record<string, string> = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif',
      'image/webp': 'webp', 'image/bmp': 'bmp', 'image/tiff': 'tiff',
    };
    const ext = extMap[ctype] || 'png';

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(buf)], { type: ctype }), `gambar.${ext}`);
    form.append('apikey', process.env.OCR_SPACE_API_KEY || 'helloworld');
    form.append('language', (params.get('language') || 'eng').trim());
    form.append('OCREngine', (params.get('engine') || '2').trim());
    form.append('scale', 'true');
    const res = await fetch('https://api.ocr.space/parse/image/', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const body = await res.json();
    if (body?.IsErroredOnProcessing) {
      const msg = Array.isArray(body.ErrorMessage) ? body.ErrorMessage.join('; ') : String(body.ErrorMessage || 'OCR gagal memproses gambar');
      throw paramError(msg, 422);
    }
    const texts: string[] = (body?.ParsedResults || []).map((r: any) => r?.ParsedText).filter((t: any) => t && String(t).trim());
    const teks = texts.join('\n').trim();
    if (!teks) throw paramError('Tidak ada teks yang terbaca pada gambar tersebut', 404);
    return {
      status: true,
      creator: 'mazval',
      result: { url, teks, jumlah_karakter: teks.length, waktu_proses_ms: Number(body?.ProcessingTimeInMilliseconds) || null, sumber: 'OCR.space API' },
    };
  },

  '/api/info/arti-nama': async (params) => {
    const nama = (params.get('nama') || params.get('name') || '').trim();
    if (!nama) throw paramError('Parameter nama wajib diisi. Contoh: ?nama=Ahmad');

    let cache = namaCache;
    if (!cache) {
      const res = await fetch('https://raw.githubusercontent.com/bachors/nama-bayi-json/master/nama.json', { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error('API_UNAVAILABLE');
      cache = await res.json();
      if (!Array.isArray(cache) || cache.length === 0) throw new Error('API_UNAVAILABLE');
      namaCache = cache;
    }

    const needle = nama.toLowerCase();
    const exact = cache.find((n: any) => String(n.nama).toLowerCase() === needle);
    if (exact) {
      return { status: true, creator: 'mazval', result: { nama: exact.nama, arti: exact.arti, asal: exact.asal, kelamin: exact.kelamin, sumber: 'Dataset Nama (50.939 entri)' } };
    }
    const mirip = cache.filter((n: any) => String(n.nama).toLowerCase().includes(needle)).slice(0, 10);
    if (mirip.length === 0) throw paramError(`Nama "${nama}" tidak ditemukan dalam dataset`, 404);
    return { status: true, creator: 'mazval', result: { query: nama, catatan: 'Nama persis tidak ditemukan, berikut nama mirip', total: mirip.length, data: mirip, sumber: 'Dataset Nama (50.939 entri)' } };
  },

  '/api/info/tafsir-mimpi': async (params) => {
    const mimpi = (params.get('mimpi') || params.get('q') || params.get('query') || params.get('nomor') || '').trim();
    if (!mimpi) throw paramError('Parameter mimpi wajib diisi. Contoh: ?mimpi=ular');
    const res = await fetch(`https://www.primbon.com/tafsir_mimpi.php?mimpi=${encodeURIComponent(mimpi)}&submit=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const html = await res.text();
    let teks = html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/[ \t]+/g, ' ');
    const mulai = teks.indexOf('Hasil pencarian untuk kata kunci:');
    const akhir = teks.indexOf('Solusi -');
    if (mulai === -1) throw paramError(`Tafsir mimpi untuk "${mimpi}" tidak ditemukan`, 404);
    const bagian = teks.slice(mulai, akhir === -1 ? undefined : akhir);
    const data = bagian.split('\n')
      .map(l => l.trim())
      .filter(l => l.includes('='))
      .map(l => {
        const i = l.indexOf('=');
        return { mimpi: l.slice(0, i).trim().replace(/^\d+\.\s*/, ''), tafsir: l.slice(i + 1).trim() };
      })
      .filter(x => x.mimpi && x.tafsir);
    if (data.length === 0) throw paramError(`Tafsir mimpi untuk "${mimpi}" tidak ditemukan`, 404);
    return { status: true, creator: 'mazval', result: { query: mimpi, total: data.length, data, sumber: 'Primbon.com' } };
  },

  '/api/image/smeme': async (params) => {
    const atas = (params.get('text_atas') || params.get('atas') || params.get('text') || '').trim();
    const bawah = (params.get('text_bawah') || params.get('bawah') || params.get('text2') || '').trim();
    const background = (params.get('background') || params.get('url') || '').trim();
    if (!atas && !bawah) throw paramError('Parameter text_atas dan/atau text_bawah wajib diisi. Contoh: ?text_atas=Hello&text_bawah=World');

    const top = encodeURIComponent(atas || '_');
    const bottom = encodeURIComponent(bawah || '_');
    const url = background
      ? `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(background)}`
      : `https://api.memegen.link/images/fry/${top}/${bottom}.png`;

    const cek = await fetch(url, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!cek || !cek.ok) {
      if (background) throw paramError('Background tidak dapat diakses atau format URL tidak valid', 400);
      throw new Error('API_UNAVAILABLE');
    }
    return {
      status: true,
      creator: 'mazval',
      result: { url, text_atas: atas, text_bawah: bawah, background: background || 'template default (fry)', sumber: 'MemeGen.link' },
    };
  },
};

export function getFreeApiHandler(servicePath: string): ((params: URLSearchParams) => Promise<any>) | null {
  return FREE_APIS[servicePath] || null;
}

export function isFreeApiAvailable(servicePath: string): boolean {
  return servicePath in FREE_APIS;
}
