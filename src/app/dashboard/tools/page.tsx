"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Bot, Download, Info, Wrench, Mail, ShieldCheck, Scan, Globe, Image, Music, Video, Headphones, Link2, Search, Hash, FileText, MessageSquare, Sparkles } from "lucide-react";

interface Endpoint {
  method: string;
  path: string;
  title: string;
  desc: string;
  category: string;
  icon: any;
  available: boolean;
}

const allEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/ai/gpt", title: "GPT", desc: "Akses model GPT", category: "AI", icon: Bot, available: true },
  { method: "GET", path: "/api/ai/chatgpt", title: "ChatGPT", desc: "Akses ChatGPT", category: "AI", icon: MessageSquare, available: true },
  { method: "GET", path: "/api/ai/gemini", title: "Gemini", desc: "Akses Google Gemini", category: "AI", icon: Sparkles, available: true },
  { method: "GET", path: "/api/ai/grammar", title: "Grammar Check", desc: "Cek grammar teks", category: "AI", icon: FileText, available: true },
  { method: "GET", path: "/api/ai/image", title: "Image Gen", desc: "Buat gambar dari teks", category: "AI", icon: Image, available: true },
  { method: "GET", path: "/api/ai/claude-opus", title: "Claude Opus", desc: "Akses Claude Opus", category: "AI", icon: Bot, available: false },
  { method: "GET", path: "/api/ai/copilot", title: "Copilot", desc: "Akses Microsoft Copilot", category: "AI", icon: Bot, available: false },
  { method: "GET", path: "/api/ai/felo", title: "Felo", desc: "Akses Felo AI", category: "AI", icon: Search, available: false },
  { method: "GET", path: "/api/ai/apertus", title: "Apertus", desc: "Akses Apertus AI", category: "AI", icon: Bot, available: false },
  { method: "GET", path: "/api/ai/anime-art", title: "Anime Art", desc: "Buat gambar anime", category: "AI", icon: Image, available: false },
  { method: "GET", path: "/api/ai/anime-to-real", title: "Anime to Real", desc: "Ubah anime ke realistis", category: "AI", icon: Image, available: false },
  { method: "GET", path: "/api/ai/anime-result", title: "Anime Result", desc: "Hasil anime", category: "AI", icon: Image, available: false },
  { method: "GET", path: "/api/ai/chibi-sticker", title: "Chibi Sticker", desc: "Buat chibi sticker", category: "AI", icon: Image, available: false },

  { method: "GET", path: "/api/download/youtube", title: "YouTube", desc: "Download video YouTube", category: "Downloader", icon: Video, available: false },
  { method: "GET", path: "/api/download/youtube-mp3", title: "YouTube MP3", desc: "Download audio YouTube", category: "Downloader", icon: Headphones, available: false },
  { method: "GET", path: "/api/download/tiktok", title: "TikTok", desc: "Download video TikTok", category: "Downloader", icon: Video, available: false },
  { method: "GET", path: "/api/download/instagram", title: "Instagram", desc: "Download dari Instagram", category: "Downloader", icon: Image, available: false },
  { method: "GET", path: "/api/download/facebook", title: "Facebook", desc: "Download dari Facebook", category: "Downloader", icon: Video, available: false },
  { method: "GET", path: "/api/download/twitter", title: "Twitter/X", desc: "Download dari Twitter", category: "Downloader", icon: Hash, available: false },
  { method: "GET", path: "/api/download/spotify", title: "Spotify", desc: "Download dari Spotify", category: "Downloader", icon: Music, available: false },
  { method: "GET", path: "/api/download/pinterest", title: "Pinterest", desc: "Download dari Pinterest", category: "Downloader", icon: Image, available: false },
  { method: "GET", path: "/api/download/terabox", title: "Terabox", desc: "Download dari Terabox", category: "Downloader", icon: Link2, available: false },
  { method: "GET", path: "/api/download/safefileku", title: "SafeFileku", desc: "Download dari SafeFileku", category: "Downloader", icon: Link2, available: false },

  { method: "GET", path: "/api/info/crypto", title: "Crypto", desc: "Harga cryptocurrency", category: "Info", icon: Globe, available: false },
  { method: "GET", path: "/api/info/gempa", title: "Gempa", desc: "Info gempa terkini", category: "Info", icon: Globe, available: false },
  { method: "GET", path: "/api/info/netflix", title: "Netflix", desc: "Cek akun Netflix", category: "Info", icon: Search, available: false },
  { method: "GET", path: "/api/info/netflix-trending", title: "Netflix Trending", desc: "Film trending Netflix", category: "Info", icon: Globe, available: false },
  { method: "GET", path: "/api/info/spotify-top", title: "Spotify Top", desc: "Top lagu Spotify", category: "Info", icon: Music, available: false },
  { method: "GET", path: "/api/info/cek-ewallet", title: "Cek E-Wallet", desc: "Cek saldo e-wallet", category: "Info", icon: Globe, available: false },

  { method: "GET", path: "/api/tools/currency", title: "Currency", desc: "Konversi mata uang", category: "Tools", icon: Globe, available: false },
  { method: "GET", path: "/api/tools/ip-lookup", title: "IP Lookup", desc: "Cek info IP address", category: "Tools", icon: Search, available: false },
  { method: "GET", path: "/api/tools/ssweb", title: "SS Web", desc: "Screenshot website", category: "Tools", icon: Image, available: false },
  { method: "GET", path: "/api/tools/domain-recon", title: "Domain Recon", desc: "Reconnaissance domain", category: "Tools", icon: Globe, available: false },
  { method: "GET", path: "/api/tools/cek-nomor", title: "Cek Nomor", desc: "Cek info nomor HP", category: "Tools", icon: Hash, available: false },
  { method: "GET", path: "/api/tools/am-verif-send", title: "AM Verif Send", desc: "Kirim magic link", category: "Tools", icon: ShieldCheck, available: false },
  { method: "GET", path: "/api/tools/am-verif-check", title: "AM Verif Check", desc: "Verifikasi premium", category: "Tools", icon: Scan, available: false },

  { method: "GET", path: "/api/tempmail/create", title: "Create Email", desc: "Buat email temporary", category: "TempMail", icon: Mail, available: true },
  { method: "GET", path: "/api/tempmail/inbox", title: "Inbox", desc: "Cek inbox email", category: "TempMail", icon: Mail, available: true },
];

const categoryColors: Record<string, string> = {
  AI: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Downloader: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  Tools: "text-lime-400 bg-lime-500/10 border-lime-500/20",
  TempMail: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

export default function UserToolsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.role === "admin") router.push("/admin");
    if (!authLoading && user?.status === "pending") router.push("/pending");
  }, [user, authLoading, router]);

  const isPaid = user?.tier && user?.tier !== "free" && user?.tier !== "Gratis";

  const endpoints = allEndpoints.map(ep => ({
    ...ep,
    available: isPaid ? true : ep.available,
  }));

  const categories = ["all", ...Array.from(new Set(endpoints.map(e => e.category)))];
  const filtered = activeCategory === "all" ? endpoints : endpoints.filter(e => e.category === activeCategory);
  const availableCount = endpoints.filter(e => e.available).length;

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">API Tools</h1>
          <p className="text-sm text-white/30">Semua endpoint API yang tersedia. {isPaid ? "Kamu punya akses penuh." : `Paket gratis: ${availableCount} endpoint aktif.`}</p>
        </div>

        {!isPaid && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border border-neon-cyan/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-white/50">Paket Gratis terbatas pada AI (5 endpoint) + TempMail. Upgrade untuk akses penuh.</p>
              <button onClick={() => router.push("/dashboard/plan")} className="btn-primary text-sm py-2 px-4">Upgrade Paket</button>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ep, i) => (
            <motion.div
              key={ep.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`glass-card p-4 ${!ep.available ? "opacity-40" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ep.icon size={16} className={categoryColors[ep.category]?.split(" ")[0] || "text-white/40"} />
                  <h3 className="text-sm font-semibold">{ep.title}</h3>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${categoryColors[ep.category] || "text-white/40 bg-white/5 border-white/10"}`}>
                  {ep.category}
                </span>
              </div>
              <p className="text-xs text-white/30 mb-2">{ep.desc}</p>
              <div className="flex items-center justify-between">
                <code className="text-[10px] text-white/20 font-mono">{ep.path}</code>
                {!ep.available && (
                  <span className="text-[10px] text-yellow-400/60">Premium</span>
                )}
                {ep.available && (
                  <span className="text-[10px] text-green-400/60">Aktif</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
