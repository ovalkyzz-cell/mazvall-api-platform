"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Bot, Download, Info, Wrench, Mail, Play, Loader2, Copy, CheckCircle,
  ChevronDown, ChevronRight, Sparkles, Globe, Image, Music, MessageSquare,
  FileText, Search, Hash, Video, Headphones, Link2, Shield, Scan, ShieldCheck
} from "lucide-react";

interface Param {
  name: string;
  placeholder: string;
  required?: boolean;
}

interface Endpoint {
  method: string;
  path: string;
  title: string;
  desc: string;
  category: string;
  icon: any;
  params: Param[];
}

const endpoints: Endpoint[] = [
  // AI
  { method: "GET", path: "/api/ai/gpt", title: "GPT (GPT-OSS-120B)", desc: "Akses model GPT-OSS-120B", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/chatgpt", title: "ChatGPT (GPT-OSS-120B)", desc: "Akses ChatGPT via GPT-OSS-120B", category: "AI", icon: MessageSquare, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/gemini", title: "Gemini", desc: "Akses Google Gemini", category: "AI", icon: Sparkles, params: [{ name: "text", placeholder: "Teks input", required: true }, { name: "cookie", placeholder: "Cookie Gemini", required: true }, { name: "promptSystem", placeholder: "System prompt (opsional)" }] },
  { method: "GET", path: "/api/ai/deepseekr1", title: "DeepSeek R1", desc: "Akses DeepSeek R1", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/phi2", title: "Phi-2", desc: "Akses Phi-2 AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/qwq32b", title: "QWQ-32B", desc: "Akses QWQ-32B AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/glm47flash", title: "GLM-47-Flash", desc: "Akses GLM-47-Flash AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/gita", title: "Gita (Bhagavad Gita)", desc: "Tanya jawab Bhagavad Gita", category: "AI", icon: Sparkles, params: [{ name: "q", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/bibleai", title: "Bible AI", desc: "Tanya jawab Alkitab", category: "AI", icon: Sparkles, params: [{ name: "question", placeholder: "Pertanyaan", required: true }, { name: "translation", placeholder: "ESV, NKJV, dll" }] },
  { method: "GET", path: "/api/mimo/models", title: "Mimo Models", desc: "List 45+ model AI (MiMo, DeepSeek, GPT, Gemini)", category: "AI", icon: Bot, params: [] },
  { method: "POST", path: "/api/mimo/chat", title: "Mimo Chat", desc: "Chat dengan AI via Mimo API", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pesan", required: true }, { name: "model", placeholder: "xiaomi/mimo-v2.5-pro" }, { name: "messages", placeholder: "Riwayat chat (JSON)" }] },
  { method: "GET", path: "/api/ai/grammar", title: "Grammar Check (GLM-47-Flash)", desc: "Cek grammar via GLM-47-Flash", category: "AI", icon: FileText, params: [{ name: "prompt", placeholder: "Teks untuk dicek", required: true }] },
  { method: "GET", path: "/api/ai/claude-opus", title: "Claude Opus (DeepSeek R1)", desc: "Akses Claude via DeepSeek R1", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/copilot", title: "Copilot (GPT-OSS)", desc: "Akses Copilot via GPT-OSS", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/felo", title: "Felo (GPT-OSS)", desc: "Akses Felo AI via GPT-OSS", category: "AI", icon: Search, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/apertus", title: "Apertus (Phi-2)", desc: "Akses Apertus via Phi-2", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/gptoss120b", title: "GPT-OSS-120B (Direct)", desc: "Akses langsung GPT-OSS-120B", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },

  // Downloader
  { method: "GET", path: "/api/download/youtube", title: "YouTube", desc: "Download video YouTube", category: "Downloader", icon: Video, params: [{ name: "url", placeholder: "URL YouTube", required: true }] },
  { method: "GET", path: "/api/download/youtube-mp3", title: "YouTube MP3", desc: "Download audio YouTube", category: "Downloader", icon: Headphones, params: [{ name: "url", placeholder: "URL YouTube", required: true }] },
  { method: "GET", path: "/api/download/tiktok", title: "TikTok", desc: "Download video TikTok", category: "Downloader", icon: Video, params: [{ name: "url", placeholder: "URL TikTok", required: true }] },
  { method: "GET", path: "/api/download/instagram", title: "Instagram", desc: "Download dari Instagram", category: "Downloader", icon: Image, params: [{ name: "url", placeholder: "URL Instagram", required: true }] },
  { method: "GET", path: "/api/download/facebook", title: "Facebook", desc: "Download dari Facebook", category: "Downloader", icon: Video, params: [{ name: "url", placeholder: "URL Facebook", required: true }] },
  { method: "GET", path: "/api/download/twitter", title: "Twitter/X", desc: "Download dari Twitter", category: "Downloader", icon: Hash, params: [{ name: "url", placeholder: "URL Twitter", required: true }] },
  { method: "GET", path: "/api/download/spotify", title: "Spotify", desc: "Download dari Spotify", category: "Downloader", icon: Music, params: [{ name: "url", placeholder: "URL Spotify", required: true }] },
  { method: "GET", path: "/api/download/pinterest", title: "Pinterest", desc: "Download dari Pinterest", category: "Downloader", icon: Image, params: [{ name: "url", placeholder: "URL Pinterest", required: true }] },
  { method: "GET", path: "/api/download/terabox", title: "Terabox", desc: "Download dari Terabox", category: "Downloader", icon: Link2, params: [{ name: "url", placeholder: "URL Terabox", required: true }] },
  { method: "GET", path: "/api/download/safefileku", title: "SafeFileku", desc: "Download dari SafeFileku", category: "Downloader", icon: Link2, params: [{ name: "url", placeholder: "URL SafeFileku", required: true }] },

  // Info
  { method: "GET", path: "/api/info/crypto", title: "Crypto", desc: "Harga cryptocurrency", category: "Info", icon: Globe, params: [{ name: "coin", placeholder: "bitcoin, ethereum, dll" }] },
  { method: "GET", path: "/api/info/gempa", title: "Gempa", desc: "Info gempa terkini", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/netflix", title: "Netflix", desc: "Cek akun Netflix", category: "Info", icon: Search, params: [{ name: "email", placeholder: "Email Netflix", required: true }] },
  { method: "GET", path: "/api/info/netflix-trending", title: "Netflix Trending", desc: "Film trending Netflix", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/spotify-top", title: "Spotify Top", desc: "Top lagu Spotify", category: "Info", icon: Music, params: [] },
  { method: "GET", path: "/api/info/cek-ewallet", title: "Cek E-Wallet", desc: "Cek saldo e-wallet", category: "Info", icon: Globe, params: [{ name: "number", placeholder: "Nomor HP", required: true }] },

  // Tools
  { method: "GET", path: "/api/tools/currency", title: "Currency", desc: "Konversi mata uang", category: "Tools", icon: Globe, params: [{ name: "from", placeholder: "USD" }, { name: "to", placeholder: "IDR" }, { name: "amount", placeholder: "1" }] },
  { method: "GET", path: "/api/tools/ip-lookup", title: "IP Lookup", desc: "Cek info IP address", category: "Tools", icon: Search, params: [{ name: "ip", placeholder: "1.1.1.1" }] },
  { method: "GET", path: "/api/tools/ssweb", title: "SS Web", desc: "Screenshot website", category: "Tools", icon: Image, params: [{ name: "url", placeholder: "URL website", required: true }] },
  { method: "GET", path: "/api/tools/domain-recon", title: "Domain Recon", desc: "Reconnaissance domain", category: "Tools", icon: Globe, params: [{ name: "domain", placeholder: "example.com", required: true }] },
  { method: "GET", path: "/api/tools/cek-nomor", title: "Cek Nomor", desc: "Cek info nomor HP", category: "Tools", icon: Hash, params: [{ name: "number", placeholder: "08xxx", required: true }] },
  { method: "GET", path: "/api/tools/nftoken-generate", title: "NfToken Generate", desc: "Generate token Netflix Premium", category: "Tools", icon: Sparkles, params: [{ name: "count", placeholder: "Jumlah token (1-10)" }] },
  { method: "GET", path: "/api/tools/kodepos", title: "Kodepos", desc: "Cek kode pos Indonesia", category: "Tools", icon: Hash, params: [{ name: "form", placeholder: "Nama wilayah", required: true }] },
  { method: "GET", path: "/api/tools/translate", title: "Translate", desc: "Terjemahkan teks", category: "Tools", icon: FileText, params: [{ name: "text", placeholder: "Teks", required: true }, { name: "source", placeholder: "en" }, { name: "target", placeholder: "id" }] },
  { method: "GET", path: "/api/tools/countryInfo", title: "Country Info", desc: "Info negara", category: "Tools", icon: Globe, params: [{ name: "name", placeholder: "Indonesia", required: true }] },
  { method: "GET", path: "/api/tools/subdomains", title: "Subdomains", desc: "Cari subdomain", category: "Tools", icon: Search, params: [{ name: "domain", placeholder: "example.com", required: true }] },

  // Sticker
  { method: "GET", path: "/api/sticker/combot-search", title: "Combot Sticker", desc: "Cari sticker Telegram", category: "Sticker", icon: Image, params: [{ name: "q", placeholder: "Kata kunci", required: true }, { name: "page", placeholder: "Halaman" }] },

  // Stalker
  { method: "GET", path: "/api/stalk/github", title: "GitHub Stalk", desc: "Stalk akun GitHub", category: "Stalker", icon: Search, params: [{ name: "user", placeholder: "Username", required: true }] },
  { method: "GET", path: "/api/stalk/twitter", title: "Twitter Stalk", desc: "Stalk akun Twitter", category: "Stalker", icon: Search, params: [{ name: "user", placeholder: "Username", required: true }] },
  { method: "GET", path: "/api/stalk/threads", title: "Threads Stalk", desc: "Cari di Threads", category: "Stalker", icon: Search, params: [{ name: "q", placeholder: "Query", required: true }] },
  { method: "GET", path: "/api/stalk/youtube", title: "YouTube Stalk", desc: "Stalk channel YouTube", category: "Stalker", icon: Search, params: [{ name: "username", placeholder: "Username", required: true }] },
  { method: "GET", path: "/api/stalk/pinterest", title: "Pinterest Stalk", desc: "Cari di Pinterest", category: "Stalker", icon: Search, params: [{ name: "q", placeholder: "Query", required: true }] },

  // Search
  { method: "GET", path: "/api/s/applemusic", title: "Apple Music", desc: "Cari lagu Apple Music", category: "Search", icon: Music, params: [{ name: "query", placeholder: "Judul lagu", required: true }, { name: "region", placeholder: "id" }] },
  { method: "GET", path: "/api/s/gitagram", title: "Gitagram", desc: "Cari lirik lagu", category: "Search", icon: Music, params: [{ name: "search", placeholder: "Judul lagu", required: true }] },
  { method: "GET", path: "/api/s/lahelu", title: "Lahelu", desc: "Cari di Lahelu", category: "Search", icon: Search, params: [{ name: "query", placeholder: "Query", required: true }] },
  { method: "GET", path: "/api/s/duckduckgo", title: "DuckDuckGo", desc: "Cari di DuckDuckGo", category: "Search", icon: Search, params: [{ name: "query", placeholder: "Query", required: true }, { name: "kl", placeholder: "us-en" }, { name: "df", placeholder: "w" }] },
  { method: "GET", path: "/api/s/bimg", title: "BImg", desc: "Cari gambar", category: "Search", icon: Image, params: [{ name: "query", placeholder: "Kata kunci", required: true }] },
  { method: "GET", path: "/api/s/brave", title: "Brave Search", desc: "Cari di Brave", category: "Search", icon: Search, params: [{ name: "query", placeholder: "Query", required: true }] },
  { method: "GET", path: "/api/s/myinstants", title: "MyInstants", desc: "Cari suara MyInstants", category: "Search", icon: Music, params: [{ name: "query", placeholder: "Kata kunci", required: true }] },
  { method: "GET", path: "/api/s/8font", title: "8Font", desc: "Cari font", category: "Search", icon: FileText, params: [{ name: "query", placeholder: "Kata kunci", required: true }, { name: "page", placeholder: "Halaman" }] },
  { method: "GET", path: "/api/s/otakotaku", title: "OtakOtaku", desc: "Cari anime di OtakOtaku", category: "Search", icon: Search, params: [{ name: "query", placeholder: "Judul anime", required: true }] },
  { method: "GET", path: "/api/s/mcpedl", title: "MCPEDL", desc: "Cari mod Minecraft", category: "Search", icon: Search, params: [{ name: "q", placeholder: "Kata kunci", required: true }] },
  { method: "GET", path: "/api/s/mangatoon", title: "Mangatoon", desc: "Cari manga di Mangatoon", category: "Search", icon: Search, params: [{ name: "query", placeholder: "Judul manga", required: true }] },
  { method: "GET", path: "/api/s/youtube", title: "YouTube Search", desc: "Cari video YouTube", category: "Search", icon: Video, params: [{ name: "query", placeholder: "Kata kunci", required: true }] },
  { method: "GET", path: "/api/s/pinterest", title: "Pinterest Search", desc: "Cari gambar Pinterest", category: "Search", icon: Image, params: [{ name: "query", placeholder: "Kata kunci", required: true }, { name: "type", placeholder: "image" }] },

  // Random
  { method: "GET", path: "/api/r/quotesanime", title: "Quotes Anime", desc: "Random quotes anime", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/lahelu", title: "Lahelu Random", desc: "Random post Lahelu", category: "Random", icon: Sparkles, params: [] },

  // TempMail
  { method: "GET", path: "/api/tempmail/create", title: "Create Email", desc: "Buat email temporary", category: "TempMail", icon: Mail, params: [] },
  { method: "GET", path: "/api/tempmail/inbox", title: "Inbox", desc: "Cek inbox email", category: "TempMail", icon: Mail, params: [{ name: "email", placeholder: "Email temporary", required: true }] },
  { method: "GET", path: "/api/tempmail/generate", title: "Generate Email", desc: "Generate email random baru", category: "TempMail", icon: Mail, params: [{ name: "username", placeholder: "Username (opsional)" }, { name: "domain", placeholder: "Domain (opsional)" }] },
  { method: "GET", path: "/api/tempmail/domains", title: "Domains", desc: "List domain tersedia", category: "TempMail", icon: Globe, params: [] },
  { method: "GET", path: "/api/tempmail/message", title: "Read Message", desc: "Baca isi email", category: "TempMail", icon: Mail, params: [{ name: "email", placeholder: "Email", required: true }, { name: "link", placeholder: "Link pesan", required: true }] },

  // AM Verif
  { method: "GET", path: "/api/tools/am-verif-send", title: "AM Verif - Send Link", desc: "Kirim magic link ke email", category: "AM Verif", icon: ShieldCheck, params: [{ name: "email", placeholder: "Email Alight Motion", required: true }] },
  { method: "GET", path: "/api/tools/am-verif-check", title: "AM Verif - Verify", desc: "Verifikasi & aktifkan premium", category: "AM Verif", icon: Scan, params: [{ name: "email", placeholder: "Email Alight Motion", required: true }, { name: "token", placeholder: "Token/Firebase dari magic link", required: true }] },
];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  AI: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  Downloader: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  Info: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  Tools: { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
  Sticker: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  Stalker: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  Search: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  Random: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  TempMail: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "AM Verif": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

export default function AdminToolsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("AI");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [results, setResults] = useState<Record<string, { status: number; time: number; data: any }>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  const categories = [...new Set(endpoints.map((e) => e.category))];

  const handleInput = (key: string, param: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: { ...prev[key], [param]: value } }));
  };

  const runEndpoint = async (ep: Endpoint, key: string) => {
    setRunning(key);
    const params = new URLSearchParams();
    ep.params.forEach((p) => {
      const val = inputs[key]?.[p.name];
      if (val) params.set(p.name, val);
    });

    const url = `/api${ep.path.replace("/api", "")}?${params.toString()}`;
    const start = performance.now();

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const copyResult = (key: string) => {
    if (results[key]) {
      navigator.clipboard.writeText(JSON.stringify(results[key].data, null, 2));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Wrench size={24} className="text-neon-lime" />
          <div>
            <h1 className="font-display text-2xl font-bold">API Tools</h1>
            <p className="text-sm text-white/30">{endpoints.length} endpoints tersedia — akses langsung tanpa batas</p>
          </div>
        </div>

        {categories.map((cat) => {
          const catEndpoints = endpoints.filter((e) => e.category === cat);
          const colors = categoryColors[cat] || { bg: "bg-white/5", text: "text-white/60", border: "border-white/10" };
          const isExpanded = expandedCategory === cat;

          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-lg ${colors.bg} ${colors.text} text-sm font-medium border ${colors.border}`}>
                    {cat}
                  </div>
                  <span className="text-sm text-white/30">{catEndpoints.length} endpoints</span>
                </div>
                {isExpanded ? <ChevronDown size={18} className="text-white/30" /> : <ChevronRight size={18} className="text-white/30" />}
              </button>

              {isExpanded && (
                <div className="border-t border-white/5">
                  {catEndpoints.map((ep) => {
                    const key = ep.path;
                    const isEpExpanded = expandedEndpoint === key;
                    const result = results[key];
                    const isRunning = running === key;

                    return (
                      <div key={key} className="border-b border-white/5 last:border-b-0">
                        <button
                          onClick={() => setExpandedEndpoint(isEpExpanded ? null : key)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <ep.icon size={16} className={colors.text} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{ep.title}</span>
                              <code className="text-xs text-white/20 font-mono">{ep.path}</code>
                            </div>
                            <p className="text-xs text-white/30 mt-0.5">{ep.desc}</p>
                          </div>
                          {result && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${result.status === 200 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                              {result.status} · {result.time}ms
                            </span>
                          )}
                          {isEpExpanded ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />}
                        </button>

                        {isEpExpanded && (
                          <div className="px-4 pb-4 space-y-3">
                            {ep.params.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ep.params.map((p) => (
                                  <div key={p.name}>
                                    <label className="block text-xs text-white/30 mb-1">
                                      {p.name} {p.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <input
                                      type="text"
                                      value={inputs[key]?.[p.name] || ""}
                                      onChange={(e) => handleInput(key, p.name, e.target.value)}
                                      placeholder={p.placeholder}
                                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50 font-mono"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => runEndpoint(ep, key)}
                                disabled={isRunning}
                                className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                              >
                                <span className="shine" />
                                {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                {isRunning ? "Running..." : "Jalankan"}
                              </button>
                              {result && (
                                <button
                                  onClick={() => copyResult(key)}
                                  className="btn-ghost text-sm py-2 px-3 flex items-center gap-1"
                                >
                                  {copiedKey === key ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                                  {copiedKey === key ? "Disalin!" : "Copy"}
                                </button>
                              )}
                            </div>

                            {result && (
                              <div className="rounded-lg bg-black/30 border border-white/5 p-4 overflow-x-auto">
                                <pre className="text-xs font-mono text-white/60 whitespace-pre-wrap break-all">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
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
          );
        })}
      </div>
    </DashboardLayout>
  );
}
