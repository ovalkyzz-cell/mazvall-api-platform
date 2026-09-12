"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Key, BarChart3, Code2, Globe, Clock, CheckCircle, ChevronRight } from "lucide-react";

const features = [
  { icon: Key, title: "API Key Management", desc: "Generate, manage, and revoke API keys with format MVAL-XXXXXXXXXXXX. Full control at your fingertips." },
  { icon: Shield, title: "Enterprise Security", desc: "JWT authentication, rate limiting per tier, and encrypted API keys. Your data is fortress-grade protected." },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Monitor API usage with live dashboards, detailed logs, and performance metrics updated in real-time." },
  { icon: Code2, title: "Interactive Docs", desc: "Swagger-style documentation with live API testing. Try endpoints directly from the docs page." },
  { icon: Zap, title: "Smart Rate Limiting", desc: "Admin-configurable rate limits per tier. Free, Developer, and Enterprise plans with granular control." },
  { icon: Globe, title: "Global Infrastructure", desc: "99.99% uptime SLA. Deployed on edge infrastructure with automatic failover and load balancing." },
];

const tiers = [
  { name: "Free", price: "0", requests: "1,000/day", features: ["10 RPM", "100 RPH", "1 API Key", "Basic Docs", "Community Support"] },
  { name: "Developer", price: "29", requests: "20,000/day", features: ["60 RPM", "2,000 RPH", "10 API Keys", "Full Docs", "Priority Support", "Analytics"], popular: true },
  { name: "Enterprise", price: "199", requests: "100,000/day", features: ["300 RPM", "10,000 RPH", "Unlimited Keys", "Custom Docs", "24/7 Support", "SLA", "Webhooks"], enterprise: true },
];

const stats = [
  { value: "99.99%", label: "Uptime SLA" },
  { value: "50ms", label: "Avg Response" },
  { value: "10M+", label: "API Calls/Day" },
  { value: "5K+", label: "Developers" },
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
              <span className="text-xs font-medium text-white/50 tracking-wider uppercase">API Platform v2.0 — Now Available</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-5xl sm:text-6xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight mb-6"
          >
            <span className="block">Build with</span>
            <span className="gradient-text block">Api&apos;s Mazvall</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Professional REST API platform with interactive documentation, intelligent rate limiting, and developer-first tooling. Ship faster with enterprise-grade infrastructure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn-primary text-base py-4 px-8 flex items-center gap-2">
              <span className="shine" />
              {user ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight size={18} />
            </Link>
            <Link href="/docs" className="btn-ghost text-base py-4 px-8 flex items-center gap-2">
              View Documentation
              <ChevronRight size={18} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="inline-block glass-card px-6 py-4 rounded-2xl"
          >
            <p className="text-xs text-white/30 mb-2 tracking-wider uppercase">Base API Endpoint</p>
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
            <p className="text-xs tracking-wider uppercase text-neon-cyan mb-3">Features</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold">Everything you need to <span className="gradient-text">ship faster</span></h2>
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
            <p className="text-xs tracking-wider uppercase text-neon-magenta mb-3">Pricing</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold">Choose your <span className="gradient-text">tier</span></h2>
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
                    <Zap size={12} /> Most Popular
                  </div>
                )}
                <h3 className="font-display font-bold text-xl mb-2">{t.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold">${t.price}</span>
                  <span className="text-white/30 text-sm">/month</span>
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
                  {t.popular || t.enterprise ? "Get Started" : "Start Free"}
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
              Ready to <span className="gradient-text">build?</span>
            </h2>
            <p className="text-white/30 mb-8 max-w-xl mx-auto">
              Join 5,000+ developers already building with Api&apos;s Mazvall. Free forever plan available.
            </p>
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn-primary text-base py-4 px-10 inline-flex items-center gap-2">
              <span className="shine" />
              Start Building Now
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
