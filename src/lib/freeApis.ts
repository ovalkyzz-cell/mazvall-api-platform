import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT = 12000;

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
    const to = params.get('id') || params.get('to') || 'id';
    const from = params.get('from') || 'en';
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
    const pkg = params.get('package') || params.get('q') || '';
    if (!pkg) return { status: false, creator: 'mazval', message: 'Parameter package diperlukan' };
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return { status: false, creator: 'mazval', message: `Package "${pkg}" tidak ditemukan` };
    const data = await res.json();
    const latest = data['dist-tags']?.latest || 'unknown';
    const time = data.time?.[latest] || '';
    return { status: true, creator: 'mazval', result: { name: data.name, version: latest, description: data.description, author: data.author?.name || data.maintainers?.[0]?.name || 'unknown', license: data.license, homepage: data.homepage || data.repository?.url, created: data.time?.created, modified: time } };
  },

  '/api/info/crypto': async () => {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,binancecoin&vs_currencies=usd,idr', { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    return { status: true, creator: 'mazval', result: { BTC: { usd: data.bitcoin?.usd, idr: data.bitcoin?.idr }, ETH: { usd: data.ethereum?.usd, idr: data.ethereum?.idr }, SOL: { usd: data.solana?.usd, idr: data.solana?.idr }, DOGE: { usd: data.dogecoin?.usd, idr: data.dogecoin?.idr }, BNB: { usd: data.binancecoin?.usd, idr: data.binancecoin?.idr } } };
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
    const kota = params.get('kota') || params.get('q') || 'Jakarta';
    const res = await fetch(`https://wttr.in/${encodeURIComponent(kota)}?format=j1`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    const c = data.current_condition?.[0];
    const w = data.weather?.[0];
    return { status: true, creator: 'mazval', result: { kota, suhu_c: c?.temp_C, suhu_f: c?.temp_F, kelembaban: c?.humidity, deskripsi: c?.weatherDesc?.[0]?.value, angin_kmph: c?.windspeedKmph, angin_arah: c?.winddir16Point, curah_hujan_mm: c?.precipMM, visibilitas_km: c?.visibility, hari_ini: w ? { max: w.maxtempC, min: w.mintempC, sunrise: w.astronomy?.[0]?.sunrise, sunset: w.astronomy?.[0]?.sunset } : null } };
  },

  '/api/info/lyrics': async (params) => {
    const q = params.get('q') || params.get('query') || '';
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
    const channel = params.get('channel') || params.get('url') || params.get('user') || '';
    if (!channel) return { status: false, creator: 'mazval', message: 'Parameter channel/user diperlukan' };
    return { status: true, creator: 'mazval', result: { channel, search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`, note: 'YouTube channel info via search' } };
  },

  '/api/stalk/pinterest': async (params) => {
    const user = params.get('user') || params.get('username') || '';
    if (!user) return { status: false, creator: 'mazval', message: 'Parameter user diperlukan' };
    return { status: true, creator: 'mazval', result: { username: user, profile_url: `https://www.pinterest.com/${user}/`, search_url: `https://www.pinterest.com/search/pins/?q=${user}` } };
  },

  '/api/stalk/threads': async (params) => {
    const user = params.get('user') || params.get('username') || '';
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
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}` } };
  },

  '/api/s/brave': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://search.brave.com/search?q=${encodeURIComponent(q)}` } };
  },

  '/api/s/duckduckgo': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}` } };
  },

  '/api/s/applemusic': async (params) => {
    const q = params.get('query') || params.get('q') || '';
    if (!q) return { status: false, creator: 'mazval', message: 'Parameter query diperlukan' };
    return { status: true, creator: 'mazval', result: { query: q, search_url: `https://music.apple.com/search?term=${encodeURIComponent(q)}` } };
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
};

export function getFreeApiHandler(servicePath: string): ((params: URLSearchParams) => Promise<any>) | null {
  return FREE_APIS[servicePath] || null;
}

export function isFreeApiAvailable(servicePath: string): boolean {
  return servicePath in FREE_APIS;
}
