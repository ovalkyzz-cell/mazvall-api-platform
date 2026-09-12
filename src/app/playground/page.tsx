"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Play, Loader2, Key, Bot, Download, Info, Wrench, Mail, ChevronDown, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";

const BASE = "https://api-mazval.zone.id";

interface EndpointParam {
  name: string;
  placeholder: string;
}

interface Endpoint {
  method: string;
  path: string;
  title: string;
  desc: string;
  category: string;
  params: EndpointParam[];
}

const endpoints: Endpoint[] = [
  // AI
  { method: "GET", path: "/api/ai/gpt", title: "GPT", desc: "Akses model GPT", category: "AI", params: [{ name: "text", placeholder: "Teks input" }, { name: "model", placeholder: "Model (opsional)" }] },
  { method: "GET", path: "/api/ai/chatgpt", title: "ChatGPT", desc: "Akses ChatGPT", category: "AI", params: [{ name: "query", placeholder: "Pertanyaan" }, { name: "model", placeholder: "Model (opsional)" }] },
  { method: "GET", path: "/api/ai/gemini", title: "Gemini", desc: "Akses Google Gemini", category: "AI", params: [{ name: "text", placeholder: "Teks input" }] },
  { method: "GET", path: "/api/ai/claude-opus", title: "Claude Opus", desc: "Akses Claude Opus", category: "AI", params: [{ name: "text", placeholder: "Teks input" }] },
  { method: "GET", path: "/api/ai/copilot", title: "Copilot", desc: "Akses GitHub Copilot", category: "AI", params: [{ name: "text", placeholder: "Teks input" }] },
  { method: "GET", path: "/api/ai/apertus", title: "Apertus", desc: "Model open source", category: "AI", params: [{ name: "text", placeholder: "Teks input" }] },
  { method: "GET", path: "/api/ai/felo", title: "Felo", desc: "Akses Felo AI", category: "AI", params: [{ name: "text", placeholder: "Teks input" }] },
  { method: "GET", path: "/api/ai/grammar", title: "Grammar Check", desc: "Koreksi tata bahasa", category: "AI", params: [{ name: "text", placeholder: "Teks Inggris" }] },
  { method: "GET", path: "/api/ai/image", title: "Generate Gambar", desc: "Buat gambar dengan AI", category: "AI", params: [{ name: "prompt", placeholder: "Deskripsi gambar" }, { name: "model", placeholder: "Model (opsional)" }] },
  { method: "GET", path: "/api/ai/anime-art", title: "Anime Art", desc: "Buat gambar anime", category: "AI", params: [{ name: "prompt", placeholder: "Deskripsi gambar" }, { name: "seed", placeholder: "Seed (opsional)" }] },
  { method: "GET", path: "/api/ai/anime-to-real", title: "Anime to Real", desc: "Anime jadi realistis", category: "AI", params: [{ name: "image", placeholder: "URL gambar" }] },
  { method: "GET", path: "/api/ai/chibi-sticker", title: "Chibi Sticker", desc: "Stiker chibi dari gambar", category: "AI", params: [{ name: "image", placeholder: "URL gambar" }] },
  // Downloader
  { method: "GET", path: "/api/download/youtube", title: "YouTube", desc: "Download video YouTube", category: "Downloader", params: [{ name: "url", placeholder: "URL YouTube" }] },
  { method: "GET", path: "/api/download/youtube-mp3", title: "YouTube MP3", desc: "Download audio YouTube", category: "Downloader", params: [{ name: "url", placeholder: "URL YouTube" }] },
  { method: "GET", path: "/api/download/tiktok", title: "TikTok", desc: "Download video TikTok", category: "Downloader", params: [{ name: "url", placeholder: "URL TikTok" }] },
  { method: "GET", path: "/api/download/instagram", title: "Instagram", desc: "Download post/reel IG", category: "Downloader", params: [{ name: "url", placeholder: "URL Instagram" }] },
  { method: "GET", path: "/api/download/twitter", title: "Twitter/X", desc: "Download tweet", category: "Downloader", params: [{ name: "url", placeholder: "URL Twitter" }] },
  { method: "GET", path: "/api/download/facebook", title: "Facebook", desc: "Download video FB", category: "Downloader", params: [{ name: "url", placeholder: "URL Facebook" }] },
  { method: "GET", path: "/api/download/pinterest", title: "Pinterest", desc: "Download gambar Pinterest", category: "Downloader", params: [{ name: "url", placeholder: "URL Pinterest" }] },
  { method: "GET", path: "/api/download/spotify", title: "Spotify", desc: "Download musik Spotify", category: "Downloader", params: [{ name: "url", placeholder: "URL Spotify" }] },
  { method: "GET", path: "/api/download/terabox", title: "Terabox", desc: "Download dari Terabox", category: "Downloader", params: [{ name: "url", placeholder: "URL Terabox" }] },
  // Info
  { method: "GET", path: "/api/info/crypto", title: "Crypto", desc: "Harga crypto real-time", category: "Info", params: [{ name: "coin", placeholder: "bitcoin" }, { name: "vs", placeholder: "usd,idr" }] },
  { method: "GET", path: "/api/info/gempa", title: "Gempa Bumi", desc: "Info gempa terkini", category: "Info", params: [{ name: "type", placeholder: "auto" }] },
  { method: "GET", path: "/api/info/cek-ewallet", title: "Cek E-Wallet", desc: "Cek saldo e-wallet", category: "Info", params: [{ name: "ewallet", placeholder: "gopay" }, { name: "nomor", placeholder: "08xxx" }] },
  { method: "GET", path: "/api/info/netflix", title: "Netflix", desc: "Info akun Netflix", category: "Info", params: [{ name: "id", placeholder: "ID akun" }, { name: "country", placeholder: "ID" }] },
  { method: "GET", path: "/api/info/netflix-trending", title: "Netflix Trending", desc: "Film trending Netflix", category: "Info", params: [{ name: "limit", placeholder: "30" }] },
  { method: "GET", path: "/api/info/spotify-top", title: "Spotify Top", desc: "Lagu top Spotify", category: "Info", params: [{ name: "period", placeholder: "daily" }, { name: "limit", placeholder: "15" }] },
  // Tools
  { method: "GET", path: "/api/tools/currency", title: "Konversi Mata Uang", desc: "Konversi real-time", category: "Tools", params: [{ name: "from", placeholder: "USD" }, { name: "to", placeholder: "IDR" }, { name: "amount", placeholder: "1" }] },
  { method: "GET", path: "/api/tools/cek-nomor", title: "Cek Nomor HP", desc: "Info nomor handphone", category: "Tools", params: [{ name: "nomor", placeholder: "081234567890" }] },
  { method: "GET", path: "/api/tools/ip-lookup", title: "IP Lookup", desc: "Info IP address", category: "Tools", params: [{ name: "target", placeholder: "8.8.8.8" }] },
  { method: "GET", path: "/api/tools/domain-recon", title: "Domain Recon", desc: "Info domain", category: "Tools", params: [{ name: "domain", placeholder: "github.com" }] },
  { method: "GET", path: "/api/tools/ssweb", title: "Screenshot Web", desc: "Screenshot halaman web", category: "Tools", params: [{ name: "url", placeholder: "https://example.com" }] },
  // TempMail
  { method: "GET", path: "/api/tempmail/create", title: "Buat Email Temporary", desc: "Buat email sementara", category: "TempMail", params: [] },
  { method: "GET", path: "/api/tempmail/inbox", title: "Cek Inbox", desc: "Baca email masuk", category: "TempMail", params: [{ name: "address", placeholder: "email@kiracloud.me" }, { name: "limit", placeholder: "10" }] },
];

const categoryIcons: Record<string, typeof Bot> = {
  AI: Bot,
  Downloader: Download,
  Info: Info,
  Tools: Wrench,
  TempMail: Mail,
};

const categoryColors: Record<string, string> = {
  AI: "text-purple-400",
  Downloader: "text-blue-400",
  Info: "text-yellow-400",
  Tools: "text-neon-cyan",
  TempMail: "text-pink-400",
};

interface RunResult {
  status: number;
  time: number;
  data: unknown;
}

export default function PlaygroundPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("mazvall_token");
    if (!token) {
      setAuthChecked(true);
      return;
    }
    fetch("/api/keys", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.keys?.length > 0) {
          const active = d.data.keys.find((k: { active: boolean }) => k.active) || d.data.keys[0];
          setApiKey(active.key);
        }
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const setInput = (endpointKey: string, paramName: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [endpointKey]: { ...(prev[endpointKey] || {}), [paramName]: value },
    }));
  };

  const runEndpoint = async (ep: Endpoint) => {
    const key = `${ep.category}-${ep.path}`;
    if (!apiKey) return;

    setRunning(key);
    const params = new URLSearchParams();
    ep.params.forEach((p) => {
      const val = inputs[key]?.[p.name];
      if (val) params.set(p.name, val);
    });
    params.set("apikey", apiKey);

    const url = `${BASE}${ep.path}?${params.toString()}`;
    const start = performance.now();

    try {
      const res = await fetch(url);
      const data = await res.json();
      const time = Math.round(performance.now() - start);
      setResults((prev) => ({ ...prev, [key]: { status: res.status, time, data } }));
    } catch {
      const time = Math.round(performance.now() - start);
      setResults((prev) => ({ ...prev, [key]: { status: 500, time, data: { error: "Gagal menghubungi server" } } }));
    } finally {
      setRunning(null);
    }
  };

  if (authChecked && !apiKey) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="glass-card p-10">
              <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mx-auto mb-6">
                <Key size={28} className="text-neon-cyan" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-3">API Playground</h1>
              <p className="text-white/40 mb-6">
                Buat API key terlebih dahulu di Dashboard untuk menggunakan playground ini.
              </p>
              <button onClick={() => router.push("/dashboard")} className="btn-primary text-sm py-3 px-8 inline-flex items-center gap-2">
                <span className="shine" />
                Buat API Key
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const categories = [...new Set(endpoints.map((e) => e.category))];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] morph-blob" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-magenta/5 rounded-full filter blur-[100px] morph-blob" style={{ animationDelay: "-5s" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-4">
              <Play size={14} className="text-neon-lime" />
              <span className="text-xs font-medium text-white/50 tracking-wider uppercase">API Playground</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Uji Coba API</h1>
            <p className="text-white/40 max-w-xl">
              Jalankan endpoint API secara langsung dari halaman ini. Pastikan kamu sudah memiliki API key yang aktif.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Key size={12} className="text-neon-cyan" />
              <code className="text-xs font-mono text-neon-cyan/70">{apiKey}</code>
            </div>
          </motion.div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Bot;
              const color = categoryColors[cat] || "text-white/50";
              const isOpen = expandedCategory === cat;
              const catEndpoints = endpoints.filter((e) => e.category === cat);

              return (
                <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <button
                    onClick={() => setExpandedCategory(isOpen ? null : cat)}
                    className="w-full flex items-center gap-3 p-4 glass-card hover:bg-white/[0.02] transition-colors"
                  >
                    <Icon size={18} className={color} />
                    <span className="font-display font-bold text-lg flex-1 text-left">{cat}</span>
                    <span className="text-xs text-white/30">{catEndpoints.length} endpoint</span>
                    {isOpen ? <ChevronDown size={16} className="text-white/20" /> : <ChevronRight size={16} className="text-white/20" />}
                  </button>

                  {isOpen && (
                    <div className="space-y-3 mt-2 ml-4">
                      {catEndpoints.map((ep) => {
                        const key = `${ep.category}-${ep.path}`;
                        const result = results[key];
                        const isRunning = running === key;

                        return (
                          <div key={key} className="glass-card p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="badge text-xs font-mono bg-green-500/20 text-green-400">{ep.method}</span>
                              <code className="text-sm font-mono text-white/60 flex-1">{ep.path}</code>
                              <span className="text-sm text-white/40 hidden sm:block">{ep.title}</span>
                            </div>
                            <p className="text-xs text-white/30 mb-3">{ep.desc}</p>

                            {ep.params.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {ep.params.map((p) => (
                                  <input
                                    key={p.name}
                                    type="text"
                                    value={inputs[key]?.[p.name] || ""}
                                    onChange={(e) => setInput(key, p.name, e.target.value)}
                                    placeholder={p.placeholder}
                                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50 transition-all"
                                  />
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => runEndpoint(ep)}
                              disabled={isRunning}
                              className="btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-50"
                            >
                              <span className="shine" />
                              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                              {isRunning ? "Menjalankan..." : "Jalankan"}
                            </button>

                            {result && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                                <div className="flex items-center gap-3 mb-2">
                                  {result.status >= 200 && result.status < 300 ? (
                                    <div className="flex items-center gap-1 text-xs text-green-400">
                                      <CheckCircle size={12} /> {result.status}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-red-400">
                                      <XCircle size={12} /> {result.status}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-white/30">
                                    <Clock size={10} /> {result.time}ms
                                  </div>
                                </div>
                                <pre className="code-block text-xs max-h-64 overflow-auto">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
