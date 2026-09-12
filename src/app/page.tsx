"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Key, BarChart3, Code2, Globe, Clock, CheckCircle, ChevronRight } from "lucide-react";

const features = [
  { icon: Key, title: "Manajemen Kunci API", desc: "Buat, rotasi, dan cabut kunci API dengan format MVAL-XXXXXXXXXXXX. Kendali penuh di ujung jari kamu." },
  { icon: Shield, title: "Keamanan Enterprise", desc: "Autentikasi JWT, rate limit per tier, dan kunci API terenkripsi. Data kamu terlindungi tingkat benteng." },
  { icon: BarChart3, title: "Analitik Real-time", desc: "Pantau penggunaan API dengan dashboard langsung, log detail, dan metrik performa yang diperbarui real-time." },
  { icon: Code2, title: "Dokumentasi Interaktif", desc: "Dokumentasi bergaya Swagger dengan pengujian API langsung. Coba endpoint langsung dari halaman dokumentasi." },
  { icon: Zap, title: "Rate Limiting Cerdas", desc: "Batas rate limit yang dapat dikonfigurasi admin per tier. Paket Gratis, Developer, dan Enterprise dengan kontrol granular." },
  { icon: Globe, title: "Infrastruktur Global", desc: "SLA uptime 99.99%. Di-deploy pada infrastruktur edge dengan failover otomatis dan load balancing." },
];

const tiers = [
  { name: "Gratis", price: "0", requests: "1.000/hari", features: ["10 RPM", "100 RPH", "1 Kunci API", "Dokumentasi Dasar", "Dukungan Komunitas"] },
  { name: "Developer", price: "29", requests: "20.000/hari", features: ["60 RPM", "2.000 RPH", "10 Kunci API", "Dokumentasi Lengkap", "Dukungan Prioritas", "Analitik"], popular: true },
  { name: "Enterprise", price: "199", requests: "100.000/hari", features: ["300 RPM", "10.000 RPH", "Kunci Tanpa Batas", "Dokumentasi Kustom", "Dukungan 24/7", "SLA", "Webhooks"], enterprise: true },
];

const stats = [
  { value: "99.99%", label: "Uptime SLA" },
  { value: "50ms", label: "Rata-rata Respon" },
  { value: "10M+", label: "Panggilan API/Hari" },
  { value: "5K+", label: "Pengembang" },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] morph-blob" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-magenta/5 rounded-full filter blur-[100px] morph-blob" style={{ animationDelay: "-5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-lime/3 rounded-full filter blur-[80px] morph-blob" style={{ animationDelay: "-10s" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-white/50 tracking-wider uppercase">Platform API v2.0 — Sekarang Tersedia</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-5xl sm:text-6xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight mb-6"
          >
            <span className="block">Bangun dengan</span>
            <span className="gradient-text block">Api&apos;s Mazvall</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Platform API REST profesional dengan dokumentasi interaktif, rate limiting cerdas, dan tools yang ramah pengembang. Rilis lebih cepat dengan infrastruktur kelas enterprise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn-primary text-base py-4 px-8 flex items-center gap-2">
              <span className="shine" />
              {user ? "Ke Dashboard" : "Mulai Gratis"}
              <ArrowRight size={18} />
            </Link>
            <Link href="/docs" className="btn-ghost text-base py-4 px-8 flex items-center gap-2">
              Lihat Dokumentasi
              <ChevronRight size={18} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="inline-block glass-card px-6 py-4 rounded-2xl"
          >
            <p className="text-xs text-white/30 mb-2 tracking-wider uppercase">Endpoint API Dasar</p>
            <code className="text-neon-cyan font-mono text-sm sm:text-base">https://api-mazval.zone.id</code>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="font-display text-3xl sm:text-4xl font-extrabold gradient-text mb-2">{s.value}</div>
                <div className="text-sm text-white/30">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs tracking-wider uppercase text-neon-cyan mb-3">Fitur</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold">Semua yang kamu butuhkan untuk <span className="gradient-text">rilis lebih cepat</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8 glow-border group hover:bg-white/[0.04] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon size={22} className="text-neon-cyan" />
                </div>
                <h3 className="font-display font-bold text-lg mb-3">{f.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs tracking-wider uppercase text-neon-magenta mb-3">Harga</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold">Pilih <span className="gradient-text">tier kamu</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`glass-card p-8 ${t.popular ? "border-neon-cyan/30 ring-1 ring-neon-cyan/20" : ""} ${t.enterprise ? "border-neon-magenta/30 ring-1 ring-neon-magenta/20" : ""}`}
              >
                {t.popular && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-medium mb-4">
                    <Zap size={12} /> Paling Populer
                  </div>
                )}
                <h3 className="font-display font-bold text-xl mb-2">{t.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold">${t.price}</span>
                  <span className="text-white/30 text-sm">/bulan</span>
                </div>
                <p className="text-sm text-white/30 mb-6">{t.requests}</p>
                <ul className="space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle size={14} className="text-neon-cyan shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/dashboard" : "/auth/register"}
                  className={`block text-center py-3 rounded-xl text-sm font-medium transition-all ${t.popular || t.enterprise ? "btn-primary" : "btn-ghost"}`}
                >
                  {t.popular || t.enterprise ? "Mulai Sekarang" : "Mulai Gratis"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mb-6">
              Siap untuk <span className="gradient-text">membangun?</span>
            </h2>
            <p className="text-white/30 mb-8 max-w-xl mx-auto">
              Bergabung dengan 5.000+ pengembang yang sudah membangun dengan Api&apos;s Mazvall. Paket gratis selamanya tersedia.
            </p>
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn-primary text-base py-4 px-10 inline-flex items-center gap-2">
              <span className="shine" />
              Mulai Bangun Sekarang
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
