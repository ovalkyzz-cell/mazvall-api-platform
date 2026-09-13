"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Bot, Download, Info, Wrench, Mail, ShieldCheck, Scan, Globe, Image, Music, Video, Headphones, Link2, Search, Hash, FileText, MessageSquare, Sparkles, Play, Loader2, Copy, CheckCircle, ChevronDown, ChevronRight, Lock } from "lucide-react";

interface Endpoint {
  method: string;
  path: string;
  title: string;
  desc: string;
  category: string;
  icon: any;
  params: { name: string; placeholder: string; required?: boolean }[];
}

const allEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/ai/gpt", title: "GPT", desc: "Akses model GPT", category: "AI", icon: Bot, params: [{ name: "text", placeholder: "Teks input", required: true }, { name: "model", placeholder: "Model (opsional)" }] },
  { method: "GET", path: "/api/ai/chatgpt", title: "ChatGPT", desc: "Akses ChatGPT", category: "AI", icon: MessageSquare, params: [{ name: "query", placeholder: "Pertanyaan", required: true }, { name: "model", placeholder: "Model (opsional)" }] },
  { method: "GET", path: "/api/ai/gemini", title: "Gemini", desc: "Akses Google Gemini", category: "AI", icon: Sparkles, params: [{ name: "text", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/grammar", title: "Grammar Check", desc: "Cek grammar teks", category: "AI", icon: FileText, params: [{ name: "text", placeholder: "Teks untuk dicek", required: true }] },
  { method: "GET", path: "/api/ai/image", title: "Image Gen", desc: "Buat gambar dari teks", category: "AI", icon: Image, params: [{ name: "text", placeholder: "Deskripsi gambar", required: true }] },
  { method: "GET", path: "/api/ai/claude-opus", title: "Claude Opus", desc: "Akses Claude Opus", category: "AI", icon: Bot, params: [{ name: "text", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/copilot", title: "Copilot", desc: "Akses Microsoft Copilot", category: "AI", icon: Bot, params: [{ name: "text", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/felo", title: "Felo", desc: "Akses Felo AI", category: "AI", icon: Search, params: [{ name: "text", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/apertus", title: "Apertus", desc: "Akses Apertus AI", category: "AI", icon: Bot, params: [{ name: "text", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/anime-art", title: "Anime Art", desc: "Buat gambar anime", category: "AI", icon: Image, params: [{ name: "text", placeholder: "Deskripsi gambar", required: true }] },
  { method: "GET", path: "/api/ai/anime-to-real", title: "Anime to Real", desc: "Ubah anime ke realistis", category: "AI", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/ai/anime-result", title: "Anime Result", desc: "Hasil anime", category: "AI", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/ai/chibi-sticker", title: "Chibi Sticker", desc: "Buat chibi sticker", category: "AI", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },

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

  { method: "GET", path: "/api/info/crypto", title: "Crypto", desc: "Harga cryptocurrency", category: "Info", icon: Globe, params: [{ name: "coin", placeholder: "bitcoin, ethereum, dll" }] },
  { method: "GET", path: "/api/info/gempa", title: "Gempa", desc: "Info gempa terkini", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/netflix", title: "Netflix", desc: "Cek akun Netflix", category: "Info", icon: Search, params: [{ name: "email", placeholder: "Email Netflix", required: true }] },
  { method: "GET", path: "/api/info/netflix-trending", title: "Netflix Trending", desc: "Film trending Netflix", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/spotify-top", title: "Spotify Top", desc: "Top lagu Spotify", category: "Info", icon: Music, params: [] },
  { method: "GET", path: "/api/info/cek-ewallet", title: "Cek E-Wallet", desc: "Cek saldo e-wallet", category: "Info", icon: Globe, params: [{ name: "number", placeholder: "Nomor HP", required: true }] },

  { method: "GET", path: "/api/tools/currency", title: "Currency", desc: "Konversi mata uang", category: "Tools", icon: Globe, params: [{ name: "from", placeholder: "USD" }, { name: "to", placeholder: "IDR" }, { name: "amount", placeholder: "1" }] },
  { method: "GET", path: "/api/tools/ip-lookup", title: "IP Lookup", desc: "Cek info IP address", category: "Tools", icon: Search, params: [{ name: "ip", placeholder: "1.1.1.1" }] },
  { method: "GET", path: "/api/tools/ssweb", title: "SS Web", desc: "Screenshot website", category: "Tools", icon: Image, params: [{ name: "url", placeholder: "URL website", required: true }] },
  { method: "GET", path: "/api/tools/domain-recon", title: "Domain Recon", desc: "Reconnaissance domain", category: "Tools", icon: Globe, params: [{ name: "domain", placeholder: "example.com", required: true }] },
  { method: "GET", path: "/api/tools/cek-nomor", title: "Cek Nomor", desc: "Cek info nomor HP", category: "Tools", icon: Hash, params: [{ name: "number", placeholder: "08xxx", required: true }] },
  { method: "GET", path: "/api/tools/am-verif-send", title: "AM Verif Send", desc: "Kirim magic link", category: "Tools", icon: ShieldCheck, params: [{ name: "email", placeholder: "Email Alight Motion", required: true }] },
  { method: "GET", path: "/api/tools/am-verif-check", title: "AM Verif Check", desc: "Verifikasi premium", category: "Tools", icon: Scan, params: [{ name: "email", placeholder: "Email", required: true }, { name: "token", placeholder: "Token", required: true }] },
  { method: "GET", path: "/api/tools/nftoken-generate", title: "NfToken Generate", desc: "Generate token Netflix Premium", category: "Tools", icon: Sparkles, params: [{ name: "count", placeholder: "Jumlah token (1-10)" }] },

  { method: "GET", path: "/api/tempmail/create", title: "Create Email", desc: "Buat email temporary", category: "TempMail", icon: Mail, params: [] },
  { method: "GET", path: "/api/tempmail/inbox", title: "Inbox", desc: "Cek inbox email", category: "TempMail", icon: Mail, params: [{ name: "email", placeholder: "Email temporary", required: true }] },
];

const FREE_ACCESS = ["ai", "tempmail"];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  AI: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  Downloader: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  Info: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  Tools: { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
  TempMail: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
};

export default function UserToolsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("AI");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [results, setResults] = useState<Record<string, { status: number; time: number; data: any }>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.role === "admin") router.push("/admin");
    if (!authLoading && user?.status === "pending") router.push("/pending");
  }, [user, authLoading, router]);

  const isPaid = user?.tier && user?.tier !== "free" && user?.tier !== "Gratis";

  const hasAccess = (category: string) => {
    if (isPaid) return true;
    return FREE_ACCESS.includes(category.toLowerCase());
  };

  const categories = [...new Set(allEndpoints.map(e => e.category))];

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
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">API Tools</h1>
          <p className="text-sm text-white/30">
            {isPaid ? "Akses penuh ke seluruh endpoint." : `Paket Gratis — ${FREE_ACCESS.length} kategori aktif. Upgrade untuk akses penuh.`}
          </p>
        </div>

        {!isPaid && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border border-neon-cyan/20 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-white/50">Ingin akses Download, Info, dan Tools? Upgrade paket sekarang.</p>
            <button onClick={() => router.push("/dashboard/plan")} className="btn-primary text-sm py-2 px-4">Upgrade</button>
          </motion.div>
        )}

        {categories.map((cat) => {
          const catEndpoints = allEndpoints.filter((e) => e.category === cat);
          const colors = categoryColors[cat] || { bg: "bg-white/5", text: "text-white/60", border: "border-white/10" };
          const isExpanded = expandedCategory === cat;
          const catAllowed = hasAccess(cat);

          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`glass-card overflow-hidden ${!catAllowed ? "opacity-50" : ""}`}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-lg ${colors.bg} ${colors.text} text-sm font-medium border ${colors.border}`}>
                    {cat}
                  </div>
                  <span className="text-sm text-white/30">{catEndpoints.length} endpoints</span>
                  {!catAllowed && <Lock size={14} className="text-yellow-400" />}
                </div>
                {isExpanded ? <ChevronDown size={18} className="text-white/30" /> : <ChevronRight size={18} className="text-white/30" />}
              </button>

              {isExpanded && (
                <div className="border-t border-white/5">
                  {catEndpoints.map((ep) => {
                    const key = ep.path;
                    const isEpExpanded = expandedEndpoint === key;
                    const result = results[key];
                    const isRunningEndpoint = running === key;

                    return (
                      <div key={key} className="border-b border-white/5 last:border-b-0">
                        <button
                          onClick={() => catAllowed && setExpandedEndpoint(isEpExpanded ? null : key)}
                          className={`w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left ${!catAllowed ? "cursor-not-allowed" : ""}`}
                        >
                          <ep.icon size={16} className={colors.text} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{ep.title}</span>
                              <code className="text-xs text-white/20 font-mono">{ep.path}</code>
                            </div>
                            <p className="text-xs text-white/30 mt-0.5">{ep.desc}</p>
                          </div>
                          {!catAllowed && <Lock size={14} className="text-yellow-400/60" />}
                          {result && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${result.status === 200 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                              {result.status} · {result.time}ms
                            </span>
                          )}
                          {catAllowed && (isEpExpanded ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />)}
                        </button>

                        {isEpExpanded && catAllowed && (
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
                                disabled={isRunningEndpoint}
                                className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                              >
                                <span className="shine" />
                                {isRunningEndpoint ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                {isRunningEndpoint ? "Running..." : "Jalankan"}
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
