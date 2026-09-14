"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight, Code2, Lock, Key, BarChart3, Shield, Zap, Bot, Download, Info, Mail, Wrench, ShieldCheck, Globe } from "lucide-react";

const BASE = "https://api-mazval.zone.id";

interface Endpoint {
  method: string;
  path: string;
  title: string;
  desc: string;
  auth: boolean;
  body?: string;
  response?: string;
  params?: string;
  curlExample?: string;
  jsExample?: string;
}

const sections: { title: string; icon: JSX.Element; endpoints: Endpoint[] }[] = [
  {
    title: "Autentikasi",
    icon: <Lock size={18} className="text-neon-magenta" />,
    endpoints: [
      {
        method: "POST", path: "/api/auth/register", title: "Daftar Akun", desc: "Buat akun pengguna baru", auth: false,
        body: `{ "email": "user@example.com", "password": "secret123", "name": "John" }`,
        response: `{ "success": true, "data": { "user": { "id": "...", "email": "...", "name": "John", "role": "user", "tier": "free" }, "token": "eyJhbG..." } }`,
        curlExample: `curl -X POST ${BASE}/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"secret","name":"You"}'`,
        jsExample: `const res = await fetch("${BASE}/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "you@example.com",
    password: "secret",
    name: "You"
  })
});
const data = await res.json();
console.log(data);`
      },
      {
        method: "POST", path: "/api/auth/login", title: "Masuk", desc: "Autentikasi dan dapatkan token JWT", auth: false,
        body: `{ "email": "user@example.com", "password": "secret123" }`,
        response: `{ "success": true, "data": { "user": { "id": "...", "email": "...", "name": "John", "role": "user", "tier": "free" }, "token": "eyJhbG..." } }`,
        curlExample: `curl -X POST ${BASE}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"secret"}'`,
        jsExample: `const res = await fetch("${BASE}/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "you@example.com",
    password: "secret"
  })
});
const { data } = await res.json();
const token = data.token; // simpan token ini`
      },
      {
        method: "GET", path: "/api/auth/me", title: "Profil Pengguna", desc: "Dapatkan profil pengguna yang sedang login", auth: true,
        response: `{ "success": true, "data": { "id": "...", "email": "...", "name": "John", "role": "user", "tier": "free" } }`,
        curlExample: `curl ${BASE}/api/auth/me \\
  -H "Authorization: Bearer TOKEN_ANDA"`,
        jsExample: `const res = await fetch("${BASE}/api/auth/me", {
  headers: { "Authorization": "Bearer " + token }
});
const { data } = await res.json();
console.log(data);`
      },
    ],
  },
  {
    title: "Manajemen Kunci API",
    icon: <Key size={18} className="text-neon-lime" />,
    endpoints: [
      {
        method: "GET", path: "/api/keys", title: "Daftar Kunci API", desc: "Dapatkan semua kunci API untuk pengguna", auth: true,
        response: `{ "success": true, "data": { "keys": [...] } }`,
        curlExample: `curl ${BASE}/api/keys \\
  -H "Authorization: Bearer TOKEN_ANDA"`,
        jsExample: `const res = await fetch("${BASE}/api/keys", {
  headers: { "Authorization": "Bearer " + token }
});
const { data } = await res.json();
console.log(data.keys);`
      },
      {
        method: "POST", path: "/api/keys", title: "Buat Kunci API", desc: "Buat kunci API baru", auth: true,
        body: `{ "name": "My App" }`,
        response: `{ "success": true, "data": { "apiKey": { "id": "...", "key": "MVAL-XXXXXXXXXXXX", "name": "My App" } } }`,
        curlExample: `curl -X POST ${BASE}/api/keys \\
  -H "Authorization: Bearer TOKEN_ANDA" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My App"}'`,
        jsExample: `const res = await fetch("${BASE}/api/keys", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name: "My App" })
});
const { data } = await res.json();
console.log(data.apiKey.key); // MVAL-XXXXXXXXXXXX`
      },
      {
        method: "DELETE", path: "/api/keys/:id", title: "Hapus Kunci API", desc: "Cabut kunci API", auth: true,
        response: `{ "success": true }`,
        curlExample: `curl -X DELETE ${BASE}/api/keys/KEY_ID \\
  -H "Authorization: Bearer TOKEN_ANDA"`,
        jsExample: `const res = await fetch(\`${BASE}/api/keys/\${keyId}\`, {
  method: "DELETE",
  headers: { "Authorization": "Bearer " + token }
});
const data = await res.json();
console.log(data);`
      },
      {
        method: "PATCH", path: "/api/keys/:id", title: "Aktifkan/Nonaktifkan Kunci", desc: "Toggle status aktif kunci API", auth: true,
        body: `{ "active": false }`,
        response: `{ "success": true, "data": { "apiKey": { "active": false } } }`,
        curlExample: `curl -X PATCH ${BASE}/api/keys/KEY_ID \\
  -H "Authorization: Bearer TOKEN_ANDA" \\
  -H "Content-Type: application/json" \\
  -d '{"active":false}'`,
        jsExample: `const res = await fetch(\`${BASE}/api/keys/\${keyId}\`, {
  method: "PATCH",
  headers: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ active: false })
});
const data = await res.json();`
      },
      {
        method: "POST", path: "/api/validate", title: "Validasi Kunci API", desc: "Validasi kunci API dan cek rate limit", auth: false,
        body: `{ "apikey": "MVAL-XXXXXXXXXXXX" }`,
        response: `{ "success": true, "data": { "valid": true, "tier": "developer", "rateLimit": 60, "remaining": 55 } }`,
        curlExample: `curl -X POST ${BASE}/api/validate \\
  -H "Content-Type: application/json" \\
  -d '{"apikey":"MVAL-XXXXXXXXXXXX"}'`,
        jsExample: `const res = await fetch("${BASE}/api/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apikey: "MVAL-XXXXXXXXXXXX" })
});
const data = await res.json();
console.log(data);`
      },
    ],
  },
  {
    title: "AI",
    icon: <Bot size={18} className="text-purple-400" />,
    endpoints: [
      { method: "GET", path: "/api/ai/gpt", title: "GPT", desc: "Akses model GPT", auth: true, params: "text, model (opsional)", curlExample: `curl "${BASE}/api/ai/gpt?text=Halo&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/gpt?text=Halo&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/chatgpt", title: "ChatGPT", desc: "Akses ChatGPT", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/chatgpt?text=Jelaskan+kuantum&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/chatgpt?text=Jelaskan+kuantum&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/gemini", title: "Gemini", desc: "Akses Google Gemini", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/gemini?text=Makanan+terbaik&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/gemini?text=Makanan+terbaik&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/claude-opus", title: "Claude Opus", desc: "Akses Claude Opus", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/claude-opus?text=Halo&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/claude-opus?text=Halo&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/copilot", title: "Copilot", desc: "Akses GitHub Copilot", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/copilot?text=Beri+3+ide&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/copilot?text=Beri+3+ide&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/apertus", title: "Apertus", desc: "Akses model open source", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/apertus?text=Apa+itu+open+source&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/apertus?text=Apa+itu+open+source&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/felo", title: "Felo", desc: "Akses Felo AI", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/felo?text=Berita+terbaru&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/felo?text=Berita+terbaru&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/grammar", title: "Grammar Check", desc: "Koreksi tata bahasa Inggris", auth: true, params: "text", curlExample: `curl "${BASE}/api/ai/grammar?text=she+dont+likes+apple&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/grammar?text=she+dont+likes+apple&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/image", title: "Generate Gambar", desc: "Buat gambar dengan AI", auth: true, params: "prompt, model (opsional)", curlExample: `curl "${BASE}/api/ai/image?prompt=kucing+lucu&model=flux&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/image?prompt=kucing+lucu&model=flux&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/anime-art", title: "Anime Art", desc: "Buat gambar anime", auth: true, params: "prompt", curlExample: `curl "${BASE}/api/ai/anime-art?prompt=cute+girl&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/anime-art?prompt=cute+girl&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/anime-result", title: "Hasil Anime", desc: "Cek hasil generate anime", auth: true, params: "task_id", curlExample: `curl "${BASE}/api/ai/anime-result?task_id=xxx&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/anime-result?task_id=xxx&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/anime-to-real", title: "Anime to Real", desc: "Ubah anime jadi realistis", auth: true, params: "image", curlExample: `curl "${BASE}/api/ai/anime-to-real?image=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/anime-to-real?image=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/ai/chibi-sticker", title: "Chibi Sticker", desc: "Buat stiker chibi dari gambar", auth: true, params: "image", curlExample: `curl "${BASE}/api/ai/chibi-sticker?image=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/ai/chibi-sticker?image=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
    ],
  },
  {
    title: "Downloader",
    icon: <Download size={18} className="text-blue-400" />,
    endpoints: [
      { method: "GET", path: "/api/download/youtube", title: "YouTube", desc: "Download video YouTube", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/youtube?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/youtube?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/youtube-mp3", title: "YouTube MP3", desc: "Download audio YouTube", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/youtube-mp3?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/youtube-mp3?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/tiktok", title: "TikTok", desc: "Download video TikTok", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/tiktok?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/tiktok?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/instagram", title: "Instagram", desc: "Download post/reel Instagram", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/instagram?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/instagram?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/twitter", title: "Twitter/X", desc: "Download tweet Twitter/X", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/twitter?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/twitter?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/facebook", title: "Facebook", desc: "Download video Facebook", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/facebook?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/facebook?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/pinterest", title: "Pinterest", desc: "Download gambar Pinterest", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/pinterest?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/pinterest?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/spotify", title: "Spotify", desc: "Download musik Spotify", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/spotify?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/spotify?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/terabox", title: "Terabox", desc: "Download dari Terabox", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/terabox?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/terabox?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/download/safefileku", title: "SafeFileku", desc: "Download dari SafeFileku", auth: true, params: "url", curlExample: `curl "${BASE}/api/download/safefileku?url=URL&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/download/safefileku?url=URL&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
    ],
  },
  {
    title: "Informasi",
    icon: <Info size={18} className="text-yellow-400" />,
    endpoints: [
      { method: "GET", path: "/api/info/crypto", title: "Crypto", desc: "Harga cryptocurrency real-time", auth: true, params: "coin, vs", curlExample: `curl "${BASE}/api/info/crypto?coin=bitcoin&vs=usd,idr&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/info/crypto?coin=bitcoin&vs=usd,idr&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/info/gempa", title: "Gempa Bumi", desc: "Info gempa bumi terkini", auth: true, params: "type", curlExample: `curl "${BASE}/api/info/gempa?type=auto&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/info/gempa?type=auto&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/info/cek-ewallet", title: "Cek E-Wallet", desc: "Cek saldo e-wallet", auth: true, params: "ewallet, nomor", curlExample: `curl "${BASE}/api/info/cek-ewallet?ewallet=gopay&nomor=08xxx&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/info/cek-ewallet?ewallet=gopay&nomor=08xxx&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/info/netflix", title: "Netflix", desc: "Cek info akun Netflix", auth: true, params: "id, country", curlExample: `curl "${BASE}/api/info/netflix?id=xxx&country=ID&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/info/netflix?id=xxx&country=ID&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/info/netflix-trending", title: "Netflix Trending", desc: "Film/series Netflix trending", auth: true, params: "limit", curlExample: `curl "${BASE}/api/info/netflix-trending?limit=30&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/info/netflix-trending?limit=30&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/info/spotify-top", title: "Spotify Top", desc: "Lagu top di Spotify", auth: true, params: "period, limit", curlExample: `curl "${BASE}/api/info/spotify-top?period=daily&limit=15&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/info/spotify-top?period=daily&limit=15&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
    ],
  },
  {
    title: "Tools",
    icon: <Wrench size={18} className="text-neon-cyan" />,
    endpoints: [
      { method: "GET", path: "/api/tools/currency", title: "Konversi Mata Uang", desc: "Konversi mata uang real-time", auth: true, params: "from, to, amount", curlExample: `curl "${BASE}/api/tools/currency?from=USD&to=IDR&amount=1&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/currency?from=USD&to=IDR&amount=1&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tools/cek-nomor", title: "Cek Nomor HP", desc: "Cek info nomor handphone", auth: true, params: "nomor", curlExample: `curl "${BASE}/api/tools/cek-nomor?nomor=081234567890&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/cek-nomor?nomor=081234567890&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tools/ip-lookup", title: "IP Lookup", desc: "Cek info IP address", auth: true, params: "target", curlExample: `curl "${BASE}/api/tools/ip-lookup?target=8.8.8.8&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/ip-lookup?target=8.8.8.8&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tools/domain-recon", title: "Domain Recon", desc: "Rekonstruksi informasi domain", auth: true, params: "domain", curlExample: `curl "${BASE}/api/tools/domain-recon?domain=github.com&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/domain-recon?domain=github.com&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tools/ssweb", title: "Screenshot Web", desc: "Ambil screenshot halaman web", auth: true, params: "url", curlExample: `curl "${BASE}/api/tools/ssweb?url=https://example.com&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/ssweb?url=https://example.com&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tools/nftoken-generate", title: "NfToken Generate", desc: "Generate token Netflix Premium", auth: true, params: "count", curlExample: `curl "${BASE}/api/tools/nftoken-generate?count=1&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/nftoken-generate?count=1&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
    ],
  },
  {
    title: "AM Verif",
    icon: <ShieldCheck size={18} className="text-red-400" />,
    endpoints: [
      { method: "GET", path: "/api/tools/am-verif-send", title: "Kirim Magic Link", desc: "Kirim magic link verifikasi ke email", auth: true, params: "email", curlExample: `curl "${BASE}/api/tools/am-verif-send?email=user@gmail.com&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/am-verif-send?email=user@gmail.com&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tools/am-verif-check", title: "Verifikasi Premium", desc: "Verifikasi token dan aktifkan premium", auth: true, params: "email, token", curlExample: `curl "${BASE}/api/tools/am-verif-check?email=user@gmail.com&token=FIREBASE_TOKEN&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tools/am-verif-check?email=user@gmail.com&token=FIREBASE_TOKEN&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
    ],
  },
  {
    title: "Temp Mail",
    icon: <Mail size={18} className="text-pink-400" />,
    endpoints: [
      { method: "GET", path: "/api/tempmail/create", title: "Buat Email Temporary", desc: "Buat alamat email sementara", auth: true, curlExample: `curl "${BASE}/api/tempmail/create?apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tempmail/create?apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
      { method: "GET", path: "/api/tempmail/inbox", title: "Cek Inbox", desc: "Baca email masuk", auth: true, params: "address, limit", curlExample: `curl "${BASE}/api/tempmail/inbox?address=demo@kiracloud.me&apikey=MVAL-XXX"`, jsExample: `const res = await fetch("${BASE}/api/tempmail/inbox?address=demo@kiracloud.me&apikey=MVAL-XXX");\nconst data = await res.json();\nconsole.log(data);` },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  PATCH: "bg-orange-500/20 text-orange-400",
  DELETE: "bg-red-500/20 text-red-400",
};

export default function DocsPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<Record<string, "curl" | "js">>({});

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleTab = (key: string, tab: "curl" | "js") => {
    setCodeTab((prev) => ({ ...prev, [key]: tab }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-medium mb-4">
              <Code2 size={12} /> Referensi API
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">Dokumentasi API</h1>
            <p className="text-white/40 max-w-2xl">
              Referensi lengkap REST API Api&apos;s Mazvall
            </p>
          </motion.div>

          {/* Base URL Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6 border border-neon-cyan/20">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-neon-cyan" />
              <h2 className="font-display font-bold text-lg">Base URL</h2>
            </div>
            <div className="code-block flex items-center justify-between">
              <code className="text-neon-cyan font-mono text-lg">{BASE}</code>
              <button onClick={() => copyText(BASE, "base")} className="text-white/20 hover:text-white/50">
                {copied === "base" ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">HTTPS</span>
              <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">REST API</span>
              <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">JSON</span>
              <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">CORS Enabled</span>
            </div>
          </motion.div>

          {/* Quick Start */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={18} className="text-neon-lime" /> Mulai Cepat
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/40 mb-2">1. Daftar akun</p>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => toggleTab("qs1", "curl")} className={`text-xs px-3 py-1 rounded ${(!codeTab.qs1 || codeTab.qs1 === "curl") ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>cURL</button>
                  <button onClick={() => toggleTab("qs1", "js")} className={`text-xs px-3 py-1 rounded ${codeTab.qs1 === "js" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>JavaScript</button>
                </div>
                {(!codeTab.qs1 || codeTab.qs1 === "curl") ? (
                  <div className="code-block relative">
                    <button onClick={() => copyText(`curl -X POST ${BASE}/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"secret","name":"You"}'`, "reg-curl")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                      {copied === "reg-curl" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <span className="text-green-400">curl</span> -X <span className="text-yellow-400">POST</span> <span className="text-neon-cyan">{BASE}/api/auth/register</span><br/>
                    &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Content-Type: application/json&quot;</span><br/>
                    &nbsp;&nbsp;-d <span className="text-orange-300">&apos;{`{"email":"you@example.com","password":"secret","name":"You"}`}&apos;</span>
                  </div>
                ) : (
                  <div className="code-block relative">
                    <button onClick={() => copyText(`const res = await fetch("${BASE}/api/auth/register", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email: "you@example.com", password: "secret", name: "You" })\n});\nconst data = await res.json();\nconsole.log(data);`, "reg-js")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                      {copied === "reg-js" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre className="code-block text-xs whitespace-pre-wrap"><span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-orange-300">&quot;{BASE}/api/auth/register&quot;</span>, {'{\n'}{'  '}method: <span className="text-orange-300">&quot;POST&quot;</span>,{'\n'}{'  '}headers: {'{'} <span className="text-orange-300">&quot;Content-Type&quot;</span>: <span className="text-orange-300">&quot;application/json&quot;</span> {'}'},{'\n'}{'  '}body: JSON.<span className="text-blue-400">stringify</span>({'{'} email: <span className="text-orange-300">&quot;you@example.com&quot;</span>, password: <span className="text-orange-300">&quot;secret&quot;</span>, name: <span className="text-orange-300">&quot;You&quot;</span> {'}'}){'\n'}{'}'});{'\n'}<span className="text-purple-400">const</span> data = <span className="text-purple-400">await</span> res.<span className="text-blue-400">json</span>();{'\n'}console.<span className="text-blue-400">log</span>(data);</pre>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-white/40 mb-2">2. Login & dapatkan token</p>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => toggleTab("qs2", "curl")} className={`text-xs px-3 py-1 rounded ${(!codeTab.qs2 || codeTab.qs2 === "curl") ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>cURL</button>
                  <button onClick={() => toggleTab("qs2", "js")} className={`text-xs px-3 py-1 rounded ${codeTab.qs2 === "js" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>JavaScript</button>
                </div>
                {(!codeTab.qs2 || codeTab.qs2 === "curl") ? (
                  <div className="code-block relative">
                    <button onClick={() => copyText(`curl -X POST ${BASE}/api/auth/login -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"secret"}'`, "login-curl")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                      {copied === "login-curl" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <span className="text-green-400">curl</span> -X <span className="text-yellow-400">POST</span> <span className="text-neon-cyan">{BASE}/api/auth/login</span><br/>
                    &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Content-Type: application/json&quot;</span><br/>
                    &nbsp;&nbsp;-d <span className="text-orange-300">&apos;{`{"email":"you@example.com","password":"secret"}`}&apos;</span>
                  </div>
                ) : (
                  <div className="code-block relative">
                    <button onClick={() => copyText(`const res = await fetch("${BASE}/api/auth/login", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email: "you@example.com", password: "secret" })\n});\nconst { data } = await res.json();\nconst token = data.token;`, "login-js")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                      {copied === "login-js" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre className="code-block text-xs whitespace-pre-wrap"><span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-orange-300">&quot;{BASE}/api/auth/login&quot;</span>, {'{\n'}{'  '}method: <span className="text-orange-300">&quot;POST&quot;</span>,{'\n'}{'  '}headers: {'{'} <span className="text-orange-300">&quot;Content-Type&quot;</span>: <span className="text-orange-300">&quot;application/json&quot;</span> {'}'},{'\n'}{'  '}body: JSON.<span className="text-blue-400">stringify</span>({'{'} email: <span className="text-orange-300">&quot;you@example.com&quot;</span>, password: <span className="text-orange-300">&quot;secret&quot;</span> {'}'}){'\n'}{'}'});{'\n'}<span className="text-purple-400">const</span> {'{'} data {'}'} = <span className="text-purple-400">await</span> res.<span className="text-blue-400">json</span>();{'\n'}<span className="text-purple-400">const</span> token = data.token;</pre>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-white/40 mb-2">3. Buat API Key & gunakan</p>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => toggleTab("qs3", "curl")} className={`text-xs px-3 py-1 rounded ${(!codeTab.qs3 || codeTab.qs3 === "curl") ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>cURL</button>
                  <button onClick={() => toggleTab("qs3", "js")} className={`text-xs px-3 py-1 rounded ${codeTab.qs3 === "js" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>JavaScript</button>
                </div>
                {(!codeTab.qs3 || codeTab.qs3 === "curl") ? (
                  <div className="code-block relative">
                    <button onClick={() => copyText(`curl -X POST ${BASE}/api/keys -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"My App"}'`, "gen-curl")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                      {copied === "gen-curl" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <span className="text-green-400">curl</span> -X <span className="text-yellow-400">POST</span> <span className="text-neon-cyan">{BASE}/api/keys</span><br/>
                    &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Authorization: Bearer TOKEN&quot;</span><br/>
                    &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Content-Type: application/json&quot;</span><br/>
                    &nbsp;&nbsp;-d <span className="text-orange-300">&apos;{`{"name":"My App"}`}&apos;</span>
                  </div>
                ) : (
                  <div className="code-block relative">
                    <button onClick={() => copyText(`const res = await fetch("${BASE}/api/keys", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer " + token,\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({ name: "My App" })\n});\nconst { data } = await res.json();\nconst apiKey = data.apiKey.key;`, "gen-js")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                      {copied === "gen-js" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre className="code-block text-xs whitespace-pre-wrap"><span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-orange-300">&quot;{BASE}/api/keys&quot;</span>, {'{\n'}{'  '}method: <span className="text-orange-300">&quot;POST&quot;</span>,{'\n'}{'  '}headers: {'{\n'}{'    '}&quot;Authorization&quot;: <span className="text-orange-300">&quot;Bearer &quot;</span> + token,{'\n'}{'    '}&quot;Content-Type&quot;: <span className="text-orange-300">&quot;application/json&quot;</span>{'\n'}{'  '},{'\n'}{'  '}body: JSON.<span className="text-blue-400">stringify</span>({'{'} name: <span className="text-orange-300">&quot;My App&quot;</span> {'}'}){'\n'}{'}'});{'\n'}<span className="text-purple-400">const</span> {'{'} data {'}'} = <span className="text-purple-400">await</span> res.<span className="text-blue-400">json</span>();{'\n'}<span className="text-purple-400">const</span> apiKey = data.apiKey.key; <span className="text-white/30">// MVAL-XXXXXXXXXXXX</span></pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Auth Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 mb-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Lock size={18} className="text-neon-magenta" /> Autentikasi
            </h2>
            <p className="text-sm text-white/40 mb-4">
              Semua endpoint API memerlukan kunci API yang valid. Kirimkan kunci API melalui header <code className="text-neon-cyan font-mono">X-API-Key</code> atau parameter query <code className="text-neon-cyan font-mono">?apikey=</code>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/30 mb-2">Header Method</p>
                <div className="code-block text-xs">
                  <span className="text-green-400">curl</span> <span className="text-neon-cyan">{BASE}/api/ai/gpt?text=Halo</span><br/>
                  &nbsp;&nbsp;-H <span className="text-orange-300">&quot;X-API-Key: MVAL-XXX&quot;</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-2">Query Method</p>
                <div className="code-block text-xs">
                  <span className="text-green-400">curl</span> <span className="text-neon-cyan">&quot;{BASE}/api/ai/gpt?text=Halo&amp;apikey=MVAL-XXX&quot;</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-white/30 mb-2">JavaScript (Fetch API)</p>
              <div className="code-block text-xs relative">
                <button onClick={() => copyText(`fetch("${BASE}/api/ai/gpt?text=Halo", {\n  headers: { "X-API-Key": "MVAL-XXX" }\n}).then(r => r.json()).then(console.log);`, "auth-js")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                  {copied === "auth-js" ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <pre className="whitespace-pre-wrap"><span className="text-blue-400">fetch</span>(<span className="text-orange-300">&quot;{BASE}/api/ai/gpt?text=Halo&quot;</span>, {'{\n'}{'  '}headers: {'{'} <span className="text-orange-300">&quot;X-API-Key&quot;</span>: <span className="text-orange-300">&quot;MVAL-XXX&quot;</span> {'}'}{'\n'}{'}'}).<span className="text-blue-400">then</span>(r =&gt; r.<span className="text-blue-400">json</span>()).<span className="text-blue-400">then</span>(console.log);</pre>
              </div>
            </div>
          </motion.div>

          {/* Rate Limits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 mb-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-neon-cyan" /> Batas Rate Limit
            </h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Tier</th><th>Request/Menit</th><th>Request/Jam</th><th>Request/Hari</th><th>Akses Fitur</th></tr>
                </thead>
                <tbody>
                  <tr><td><span className="badge badge-free">Free</span></td><td className="text-sm">10</td><td className="text-sm">100</td><td className="text-sm">1.000</td><td className="text-sm">AI & TempMail saja</td></tr>
                  <tr><td><span className="badge badge-developer">Developer</span></td><td className="text-sm">60</td><td className="text-sm">2.000</td><td className="text-sm">20.000</td><td className="text-sm">Seluruh Endpoint</td></tr>
                  <tr><td><span className="badge badge-enterprise">Enterprise</span></td><td className="text-sm">300</td><td className="text-sm">10.000</td><td className="text-sm">100.000</td><td className="text-sm">Seluruh Endpoint</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/30 mt-3">* Rate limit berdasarkan tier akun. Upgrade tier di dashboard untuk limit lebih tinggi.</p>
          </motion.div>

          {/* Endpoint Sections */}
          {sections.map((section, si) => (
            <motion.div key={si} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + si * 0.05 }} className="mb-4">
              <button onClick={() => setOpenSection(openSection === si ? null : si)} className="w-full flex items-center gap-3 p-4 glass-card hover:bg-white/[0.02] transition-colors mb-2">
                {section.icon}
                <span className="font-display font-bold text-lg flex-1 text-left">{section.title}</span>
                <span className="text-xs text-white/30">{section.endpoints.length} endpoint</span>
                {openSection === si ? <ChevronDown size={16} className="text-white/20" /> : <ChevronRight size={16} className="text-white/20" />}
              </button>

              {openSection === si && (
                <div className="space-y-2 ml-4">
                  {section.endpoints.map((ep, ei) => {
                    const key = `${si}-${ei}`;
                    const isOpen = openEndpoint === key;
                    const tab = codeTab[key] || "curl";
                    return (
                      <div key={ei} className="glass-card overflow-hidden">
                        <button onClick={() => setOpenEndpoint(isOpen ? null : key)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors">
                          <span className={`badge text-xs font-mono ${methodColors[ep.method]}`}>{ep.method}</span>
                          <code className="text-sm font-mono text-white/60 flex-1">{ep.path}</code>
                          <span className="text-sm text-white/40 hidden sm:block">{ep.title}</span>
                          {ep.auth && <Lock size={10} className="text-neon-magenta" />}
                          {isOpen ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />}
                        </button>
                        {isOpen && (
                          <div className="border-t border-white/5 p-4 space-y-3">
                            <p className="text-sm text-white/40">{ep.desc}</p>
                            {ep.auth && (
                              <div className="flex items-center gap-2 text-xs text-neon-magenta/70">
                                <Lock size={10} /> Memerlukan kunci API
                              </div>
                            )}
                            {ep.params && (
                              <div>
                                <span className="text-xs text-white/30 uppercase tracking-wider">Parameter:</span>
                                <code className="ml-2 text-sm text-neon-cyan font-mono">{ep.params}</code>
                              </div>
                            )}
                            {ep.body && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-white/30 uppercase tracking-wider">Request Body</span>
                                  <button onClick={() => copyText(ep.body!, `body-${key}`)} className="text-white/20 hover:text-white/50">
                                    {copied === `body-${key}` ? <Check size={12} /> : <Copy size={12} />}
                                  </button>
                                </div>
                                <pre className="code-block text-xs">{ep.body}</pre>
                              </div>
                            )}

                            {/* Code Examples with Tabs */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-2">
                                  <button onClick={() => toggleTab(key, "curl")} className={`text-xs px-3 py-1 rounded ${tab === "curl" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>cURL</button>
                                  <button onClick={() => toggleTab(key, "js")} className={`text-xs px-3 py-1 rounded ${tab === "js" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>JavaScript</button>
                                </div>
                                <button onClick={() => copyText(tab === "curl" ? (ep.curlExample || "") : (ep.jsExample || ""), `ex-${key}`)} className="text-white/20 hover:text-white/50">
                                  {copied === `ex-${key}` ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                              <pre className="code-block text-xs whitespace-pre-wrap">{tab === "curl" ? ep.curlExample : ep.jsExample}</pre>
                            </div>

                            {ep.response && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-white/30 uppercase tracking-wider">Response</span>
                                  <button onClick={() => copyText(ep.response!, `res-${key}`)} className="text-white/20 hover:text-white/50">
                                    {copied === `res-${key}` ? <Check size={12} /> : <Copy size={12} />}
                                  </button>
                                </div>
                                <pre className="code-block text-xs">{ep.response}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}

          {/* API Key Format */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Shield size={18} className="text-yellow-400" /> Format Kunci API
            </h2>
            <p className="text-sm text-white/40 mb-4">
              Semua kunci API mengikuti format <code className="text-neon-cyan font-mono font-bold">MVAL-XXXXXXXXXXXX</code> di mana X adalah string alfanumerik 12 karakter.
            </p>
            <div className="code-block text-center text-lg font-mono text-neon-cyan tracking-wider">
              MVAL-A3B7K9M2X4P8
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
