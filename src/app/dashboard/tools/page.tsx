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
  { method: "GET", path: "/api/ai/gpt", title: "GPT (GPT-OSS-120B)", desc: "Akses model GPT-OSS-120B", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/chatgpt", title: "ChatGPT (GPT-OSS-120B)", desc: "Akses ChatGPT via GPT-OSS-120B", category: "AI", icon: MessageSquare, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/gemini", title: "Gemini", desc: "Akses Google Gemini", category: "AI", icon: Sparkles, params: [{ name: "text", placeholder: "Teks input", required: true }, { name: "cookie", placeholder: "Cookie Gemini", required: true }, { name: "promptSystem", placeholder: "System prompt (opsional)" }] },
  { method: "GET", path: "/api/ai/deepseekr1", title: "DeepSeek R1", desc: "Akses DeepSeek R1", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/phi2", title: "Phi-2", desc: "Akses Phi-2 AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/qwq32b", title: "QWQ-32B", desc: "Akses QWQ-32B AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/glm47flash", title: "GLM-47-Flash", desc: "Akses GLM-47-Flash AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/grammar", title: "Grammar Check (GLM-47-Flash)", desc: "Cek grammar via GLM-47-Flash", category: "AI", icon: FileText, params: [{ name: "prompt", placeholder: "Teks untuk dicek", required: true }] },
  { method: "GET", path: "/api/ai/image", title: "Image Gen (GPT-OSS)", desc: "Buat gambar dari teks", category: "AI", icon: Image, params: [{ name: "prompt", placeholder: "Deskripsi gambar", required: true }] },
  { method: "GET", path: "/api/ai/claude-opus", title: "Claude Opus (DeepSeek R1)", desc: "Akses Claude via DeepSeek R1", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/copilot", title: "Copilot (GPT-OSS)", desc: "Akses Copilot via GPT-OSS", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/felo", title: "Felo (GPT-OSS)", desc: "Akses Felo AI via GPT-OSS", category: "AI", icon: Search, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/apertus", title: "Apertus (Phi-2)", desc: "Akses Apertus via Phi-2", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }] },
  { method: "GET", path: "/api/ai/anime-art", title: "Anime Art (GPT-OSS)", desc: "Buat gambar anime", category: "AI", icon: Image, params: [{ name: "prompt", placeholder: "Deskripsi gambar", required: true }] },
  { method: "GET", path: "/api/ai/anime-to-real", title: "Anime to Real (GPT-OSS)", desc: "Ubah anime ke realistis", category: "AI", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/ai/anime-result", title: "Anime Result (GPT-OSS)", desc: "Hasil anime", category: "AI", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/ai/chibi-sticker", title: "Chibi Sticker (GPT-OSS)", desc: "Buat chibi sticker", category: "AI", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/ai/gptoss120b", title: "GPT-OSS-120B (Direct)", desc: "Akses langsung GPT-OSS-120B", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/glm47flash", title: "GLM-47-Flash (Direct)", desc: "Akses langsung GLM-47-Flash", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/phi2", title: "Phi-2 (Direct)", desc: "Akses langsung Phi-2", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/qwq32b", title: "QWQ-32B (Direct)", desc: "Akses langsung QWQ-32B", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/deepseekr1", title: "DeepSeek R1 (Direct)", desc: "Akses langsung DeepSeek R1", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Teks input", required: true }, { name: "system", placeholder: "System prompt (opsional)" }, { name: "temperature", placeholder: "Temperature (opsional)" }] },
  { method: "GET", path: "/api/ai/gita", title: "Gita (Bhagavad Gita)", desc: "Tanya jawab Bhagavad Gita", category: "AI", icon: Sparkles, params: [{ name: "q", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/bibleai", title: "Bible AI", desc: "Tanya jawab Alkitab", category: "AI", icon: Sparkles, params: [{ name: "question", placeholder: "Pertanyaan", required: true }, { name: "translation", placeholder: "ESV, NKJV, dll" }] },
  { method: "GET", path: "/api/mimo/models", title: "Mimo Models", desc: "List 45+ model AI (MiMo, DeepSeek, GPT, Gemini)", category: "AI", icon: Bot, params: [] },
  { method: "POST", path: "/api/mimo/chat", title: "Mimo Chat", desc: "Chat dengan AI via Mimo API", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pesan", required: true }, { name: "model", placeholder: "xiaomi/mimo-v2.5-pro" }, { name: "messages", placeholder: "Riwayat chat (JSON)" }] },
  { method: "GET", path: "/api/ai/bard-google", title: "Bard Google", desc: "Akses Google Bard AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }, { name: "cookie", placeholder: "Cookie Bard (opsional)" }] },
  { method: "GET", path: "/api/ai/ai-realtime", title: "AI Realtime", desc: "Chat AI real-time", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/ai-prompt", title: "AI Prompt", desc: "Generate prompt AI", category: "AI", icon: Sparkles, params: [{ name: "prompt", placeholder: "Input prompt", required: true }] },
  { method: "GET", path: "/api/ai/ai-text2img-pro", title: "Text2Img Pro", desc: "Generate gambar dari teks", category: "AI", icon: Image, params: [{ name: "prompt", placeholder: "Deskripsi gambar", required: true }] },
  { method: "GET", path: "/api/ai/bard-img", title: "Bard Image", desc: "Generate gambar via Bard", category: "AI", icon: Image, params: [{ name: "prompt", placeholder: "Deskripsi gambar", required: true }] },
  { method: "GET", path: "/api/ai/blackbox", title: "Blackbox AI", desc: "Akses Blackbox AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/claude-ai", title: "Claude AI", desc: "Akses Claude AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }, { name: "system", placeholder: "System prompt (opsional)" }] },
  { method: "GET", path: "/api/ai/deep-ai", title: "Deep AI", desc: "Akses Deep AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/dolphin-ai", title: "Dolphin AI", desc: "Akses Dolphin AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/epsilon-ai", title: "Epsilon AI", desc: "Akses Epsilon AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/feloai", title: "Felo AI", desc: "Akses Felo AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/fluxai", title: "Flux AI", desc: "Akses Flux AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/islam-ai", title: "Islam AI", desc: "Tanya jawab Islam", category: "AI", icon: Sparkles, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/jeeves-ai", title: "Jeeves AI", desc: "Akses Jeeves AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/nano-banana", title: "Nano Banana", desc: "Akses Nano Banana AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/powerbrain-ai", title: "PowerBrain AI", desc: "Akses PowerBrain AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/publicai", title: "Public AI", desc: "Akses Public AI", category: "AI", icon: Bot, params: [{ name: "prompt", placeholder: "Pertanyaan", required: true }] },
  { method: "GET", path: "/api/ai/quillbot", title: "QuillBot", desc: "Paraphrase teks via QuillBot", category: "AI", icon: FileText, params: [{ name: "text", placeholder: "Teks untuk diparaphrase", required: true }] },

  { method: "GET", path: "/api/image/superhd", title: "SuperHD", desc: "Upscale gambar ke SuperHD", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/hdv2", title: "HD v2", desc: "Upscale gambar HD v2", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/hdv3", title: "HD v3", desc: "Upscale gambar HD v3", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/hdv4", title: "HD v4", desc: "Upscale gambar HD v4", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/blurwajah", title: "Blur Wajah", desc: "Blur wajah pada gambar", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/toanime", title: "To Anime", desc: "Ubah gambar ke anime", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/tobabi", title: "To Baby", desc: "Ubah wajah ke versi bayi", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/tobersama", title: "To Bersama", desc: "Ubah gambar ke gaya bersama", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/removebg", title: "Remove BG", desc: "Hapus background gambar", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/image/smeme", title: "S-Meme", desc: "Buat meme dari gambar", category: "Image", icon: Image, params: [{ name: "url", placeholder: "URL gambar", required: true }, { name: "text", placeholder: "Teks meme", required: true }] },
  { method: "GET", path: "/api/image/brat", title: "Brat", desc: "Generate gambar Brat style", category: "Image", icon: Image, params: [{ name: "text", placeholder: "Teks", required: true }] },
  { method: "GET", path: "/api/image/brathd", title: "Brat HD", desc: "Generate gambar Brat HD", category: "Image", icon: Image, params: [{ name: "text", placeholder: "Teks", required: true }] },
  { method: "GET", path: "/api/image/bratvid", title: "Brat Vid", desc: "Generate video Brat style", category: "Image", icon: Video, params: [{ name: "text", placeholder: "Teks", required: true }] },
  { method: "GET", path: "/api/image/codesnap", title: "CodeSnap", desc: "Screenshot kode program", category: "Image", icon: Image, params: [{ name: "code", placeholder: "Kode program", required: true }, { name: "language", placeholder: "javascript" }] },

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
  { method: "GET", path: "/api/download/aio", title: "AIO Downloader", desc: "Download dari semua platform", category: "Downloader", icon: Download, params: [{ name: "url", placeholder: "URL", required: true }] },
  { method: "GET", path: "/api/download/douyin", title: "Douyin", desc: "Download video Douyin", category: "Downloader", icon: Video, params: [{ name: "url", placeholder: "URL Douyin", required: true }] },
  { method: "GET", path: "/api/download/fbdownload", title: "FB Download", desc: "Download dari Facebook", category: "Downloader", icon: Download, params: [{ name: "url", placeholder: "URL Facebook", required: true }] },
  { method: "GET", path: "/api/download/mediafire", title: "MediaFire", desc: "Download dari MediaFire", category: "Downloader", icon: Link2, params: [{ name: "url", placeholder: "URL MediaFire", required: true }] },
  { method: "GET", path: "/api/download/soundcloud", title: "SoundCloud", desc: "Download dari SoundCloud", category: "Downloader", icon: Music, params: [{ name: "url", placeholder: "URL SoundCloud", required: true }] },

  { method: "GET", path: "/api/info/crypto", title: "Crypto", desc: "Harga cryptocurrency", category: "Info", icon: Globe, params: [{ name: "coin", placeholder: "bitcoin, ethereum, dll" }] },
  { method: "GET", path: "/api/info/gempa", title: "Gempa", desc: "Info gempa terkini", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/netflix", title: "Netflix", desc: "Cek akun Netflix", category: "Info", icon: Search, params: [{ name: "email", placeholder: "Email Netflix", required: true }] },
  { method: "GET", path: "/api/info/netflix-trending", title: "Netflix Trending", desc: "Film trending Netflix", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/spotify-top", title: "Spotify Top", desc: "Top lagu Spotify", category: "Info", icon: Music, params: [] },
  { method: "GET", path: "/api/info/cek-ewallet", title: "Cek E-Wallet", desc: "Cek saldo e-wallet", category: "Info", icon: Globe, params: [{ name: "number", placeholder: "Nomor HP", required: true }] },
  { method: "GET", path: "/api/info/arti-nama", title: "Arti Nama", desc: "Cari arti nama", category: "Info", icon: FileText, params: [{ name: "name", placeholder: "Nama", required: true }] },
  { method: "GET", path: "/api/info/cuaca", title: "Cuaca", desc: "Info cuaca terkini", category: "Info", icon: Globe, params: [{ name: "location", placeholder: "Nama kota", required: true }] },
  { method: "GET", path: "/api/info/jadwal-bola", title: "Jadwal Bola", desc: "Jadwal pertandingan bola", category: "Info", icon: Globe, params: [] },
  { method: "GET", path: "/api/info/jadwal-sholat", title: "Jadwal Sholat", desc: "Jadwal sholat harian", category: "Info", icon: Globe, params: [{ name: "city", placeholder: "Nama kota", required: true }] },
  { method: "GET", path: "/api/info/jarakkota", title: "Jarak Kota", desc: "Cek jarak antar kota", category: "Info", icon: Globe, params: [{ name: "from", placeholder: "Kota asal", required: true }, { name: "to", placeholder: "Kota tujuan", required: true }] },
  { method: "GET", path: "/api/info/tagihan-pln", title: "Tagihan PLN", desc: "Cek tagihan listrik PLN", category: "Info", icon: Hash, params: [{ name: "id", placeholder: "ID Pelanggan", required: true }] },
  { method: "GET", path: "/api/info/lyrics", title: "Lyrics", desc: "Cari lirik lagu", category: "Info", icon: Music, params: [{ name: "song", placeholder: "Judul lagu", required: true }] },
  { method: "GET", path: "/api/info/doa", title: "Doa", desc: "Cari doa harian", category: "Info", icon: Sparkles, params: [{ name: "query", placeholder: "Nama doa", required: true }] },
  { method: "GET", path: "/api/info/tafsir-mimpi", title: "Tafsir Mimpi", desc: "Tafsir mimpi 2D/3D/4D", category: "Info", icon: Search, params: [{ name: "query", placeholder: "Mimpi", required: true }] },

  { method: "GET", path: "/api/tools/currency", title: "Currency", desc: "Konversi mata uang", category: "Tools", icon: Globe, params: [{ name: "from", placeholder: "USD" }, { name: "to", placeholder: "IDR" }, { name: "amount", placeholder: "1" }] },
  { method: "GET", path: "/api/tools/ip-lookup", title: "IP Lookup", desc: "Cek info IP address", category: "Tools", icon: Search, params: [{ name: "ip", placeholder: "1.1.1.1" }] },
  { method: "GET", path: "/api/tools/ssweb", title: "SS Web", desc: "Screenshot website", category: "Tools", icon: Image, params: [{ name: "url", placeholder: "URL website", required: true }] },
  { method: "GET", path: "/api/tools/domain-recon", title: "Domain Recon", desc: "Reconnaissance domain", category: "Tools", icon: Globe, params: [{ name: "domain", placeholder: "example.com", required: true }] },
  { method: "GET", path: "/api/tools/cek-nomor", title: "Cek Nomor", desc: "Cek info nomor HP", category: "Tools", icon: Hash, params: [{ name: "number", placeholder: "08xxx", required: true }] },
  { method: "GET", path: "/api/tools/am-verif-send", title: "AM Verif Send", desc: "Kirim magic link", category: "Tools", icon: ShieldCheck, params: [{ name: "email", placeholder: "Email Alight Motion", required: true }] },
  { method: "GET", path: "/api/tools/am-verif-check", title: "AM Verif Check", desc: "Verifikasi premium", category: "Tools", icon: Scan, params: [{ name: "email", placeholder: "Email", required: true }, { name: "token", placeholder: "Token", required: true }] },
  { method: "GET", path: "/api/tools/nftoken-generate", title: "NfToken Generate", desc: "Generate token Netflix Premium", category: "Tools", icon: Sparkles, params: [{ name: "count", placeholder: "Jumlah token (1-10)" }] },
  { method: "GET", path: "/api/tools/kodepos", title: "Kodepos", desc: "Cek kode pos Indonesia", category: "Tools", icon: Hash, params: [{ name: "form", placeholder: "Nama wilayah", required: true }] },
  { method: "GET", path: "/api/tools/translate", title: "Translate", desc: "Terjemahkan teks", category: "Tools", icon: FileText, params: [{ name: "text", placeholder: "Teks", required: true }, { name: "source", placeholder: "en" }, { name: "target", placeholder: "id" }] },
  { method: "GET", path: "/api/tools/countryInfo", title: "Country Info", desc: "Info negara", category: "Tools", icon: Globe, params: [{ name: "name", placeholder: "Indonesia", required: true }] },
  { method: "GET", path: "/api/tools/subdomains", title: "Subdomains", desc: "Cari subdomain", category: "Tools", icon: Search, params: [{ name: "domain", placeholder: "example.com", required: true }] },
  { method: "GET", path: "/api/tools/npmjs", title: "NPM.js", desc: "Cari package npm", category: "Tools", icon: Search, params: [{ name: "query", placeholder: "Nama package", required: true }] },
  { method: "GET", path: "/api/tools/npm2zip", title: "NPM to ZIP", desc: "Download package npm sebagai ZIP", category: "Tools", icon: Download, params: [{ name: "package", placeholder: "Nama package", required: true }, { name: "version", placeholder: "Versi (opsional)" }] },
  { method: "GET", path: "/api/tools/ocr", title: "OCR", desc: "Ekstrak teks dari gambar", category: "Tools", icon: FileText, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/tools/qr-create", title: "QR Create", desc: "Buat kode QR", category: "Tools", icon: Hash, params: [{ name: "text", placeholder: "Teks/URL", required: true }] },
  { method: "GET", path: "/api/tools/qr-detect", title: "QR Detect", desc: "Baca kode QR dari gambar", category: "Tools", icon: Hash, params: [{ name: "url", placeholder: "URL gambar", required: true }] },
  { method: "GET", path: "/api/tools/ngl", title: "NGL Link", desc: "Buat link NGL anonymous", category: "Tools", icon: MessageSquare, params: [{ name: "username", placeholder: "Username Instagram", required: true }] },
  { method: "GET", path: "/api/tools/ngl-spam", title: "NGL Spam", desc: "Spam link NGL anonymous", category: "Tools", icon: MessageSquare, params: [{ name: "username", placeholder: "Username Instagram", required: true }, { name: "count", placeholder: "Jumlah pesan" }] },
  { method: "GET", path: "/api/tools/react-channel", title: "React Channel", desc: "React ke channel Telegram", category: "Tools", icon: MessageSquare, params: [{ name: "url", placeholder: "URL channel", required: true }, { name: "emoji", placeholder: "Emoji", required: true }] },

  { method: "GET", path: "/api/sticker/combot-search", title: "Combot Sticker", desc: "Cari sticker Telegram", category: "Sticker", icon: Image, params: [{ name: "q", placeholder: "Kata kunci", required: true }, { name: "page", placeholder: "Halaman" }] },
  { method: "GET", path: "/api/sticker/stickerly", title: "Sticker.ly", desc: "Cari sticker di Sticker.ly", category: "Sticker", icon: Image, params: [{ name: "q", placeholder: "Kata kunci", required: true }] },

  { method: "GET", path: "/api/stalk/github", title: "GitHub Stalk", desc: "Stalk akun GitHub", category: "Stalker", icon: Search, params: [{ name: "user", placeholder: "Username", required: true }] },
  { method: "GET", path: "/api/stalk/twitter", title: "Twitter Stalk", desc: "Stalk akun Twitter", category: "Stalker", icon: Search, params: [{ name: "user", placeholder: "Username", required: true }] },
  { method: "GET", path: "/api/stalk/threads", title: "Threads Stalk", desc: "Cari di Threads", category: "Stalker", icon: Search, params: [{ name: "q", placeholder: "Query", required: true }] },
  { method: "GET", path: "/api/stalk/youtube", title: "YouTube Stalk", desc: "Stalk channel YouTube", category: "Stalker", icon: Search, params: [{ name: "username", placeholder: "Username", required: true }] },
  { method: "GET", path: "/api/stalk/pinterest", title: "Pinterest Stalk", desc: "Cari di Pinterest", category: "Stalker", icon: Search, params: [{ name: "q", placeholder: "Query", required: true }] },
  { method: "GET", path: "/api/stalk/tiktokstalk", title: "TikTok Stalk", desc: "Stalk akun TikTok", category: "Stalker", icon: Search, params: [{ name: "user", placeholder: "Username TikTok", required: true }] },

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

  { method: "GET", path: "/api/r/quotesanime", title: "Quotes Anime", desc: "Random quotes anime", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/lahelu", title: "Lahelu Random", desc: "Random post Lahelu", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/pantun", title: "Pantun", desc: "Random pantun Indonesia", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/quote-bucin", title: "Quote Bucin", desc: "Random quote bucin", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/loli", title: "Loli Random", desc: "Random gambar loli", category: "Random", icon: Image, params: [] },
  { method: "GET", path: "/api/r/meme", title: "Meme Random", desc: "Random meme", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/papayang", title: "Papa Yang", desc: "Random Papa Yang", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/waifu", title: "Waifu Random", desc: "Random gambar waifu", category: "Random", icon: Image, params: [] },
  { method: "GET", path: "/api/r/asahotak", title: "Asah Otak", desc: "Kuis asah otak", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/tebaktebakan", title: "Tebak-Tebakan", desc: "Kuis tebak-tebakan", category: "Random", icon: Sparkles, params: [] },
  { method: "GET", path: "/api/r/tekateki", title: "Teka-Teki", desc: "Kuis teka-teki", category: "Random", icon: Sparkles, params: [] },

  { method: "GET", path: "/api/tempmail/create", title: "Create Email", desc: "Buat email temporary", category: "TempMail", icon: Mail, params: [] },
  { method: "GET", path: "/api/tempmail/inbox", title: "Inbox", desc: "Cek inbox email", category: "TempMail", icon: Mail, params: [{ name: "email", placeholder: "Email temporary", required: true }] },
  { method: "GET", path: "/api/tempmail/generate", title: "Generate Email", desc: "Generate email random baru", category: "TempMail", icon: Mail, params: [{ name: "username", placeholder: "Username (opsional)" }, { name: "domain", placeholder: "Domain (opsional)" }] },
  { method: "GET", path: "/api/tempmail/domains", title: "Domains", desc: "List domain tersedia", category: "TempMail", icon: Globe, params: [] },
  { method: "GET", path: "/api/tempmail/message", title: "Read Message", desc: "Baca isi email", category: "TempMail", icon: Mail, params: [{ name: "email", placeholder: "Email", required: true }, { name: "link", placeholder: "Link pesan", required: true }] },
];

const FREE_ACCESS = ["ai", "tempmail"];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  AI: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  Image: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
  Downloader: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  Info: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  Tools: { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
  Sticker: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  Stalker: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  Search: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  Random: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
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
