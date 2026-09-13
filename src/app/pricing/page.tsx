"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { CheckCircle, Zap, Star, ArrowRight, Loader2, Crown, Building2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  requestsPerDay: number;
  requestsPerMin: number;
  description: string;
  features: string;
  popular: boolean;
}

const planIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case "gratis": return Star;
    case "starter": return Zap;
    case "pro": return Crown;
    case "business": return Building2;
    case "enterprise": return Crown;
    default: return Zap;
  }
};

export default function PricingPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlans(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (planId: string) => {
    if (!user) {
      router.push("/auth/register");
      return;
    }
    if (user.status === "pending") {
      router.push("/pending");
      return;
    }
    if (user.status === "banned" || user.status === "rejected") {
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.success && data.data?.transactionId) {
        router.push(`/payment?transactionId=${data.data.transactionId}`);
      }
    } catch {
      // fallback silently
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative min-h-screen pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] morph-blob" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-magenta/5 rounded-full filter blur-[100px] morph-blob" style={{ animationDelay: "-5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-lime/3 rounded-full filter blur-[80px] morph-blob" style={{ animationDelay: "-10s" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-6">
              <Zap size={14} className="text-neon-lime" />
              <span className="text-xs font-medium text-white/50 tracking-wider uppercase">Harga Transparan</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-tight mb-4">
              Pilih <span className="gradient-text">Paket</span> yang Tepat
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Mulai gratis dan upgrade sesuai kebutuhan. Semua paket sudah termasuk akses ke seluruh endpoint API.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {plans.filter(p => p.active).map((plan, i) => {
                const Icon = planIcon(plan.name);
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`glass-card p-6 relative flex flex-col ${
                      plan.popular ? "border-neon-cyan/30 ring-1 ring-neon-cyan/20 scale-[1.02]" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs font-semibold">
                        <Zap size={10} /> POPULER
                      </div>
                    )}

                    <div className="mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        plan.popular
                          ? "bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30"
                          : "bg-white/[0.05]"
                      }`}>
                        <Icon size={18} className={plan.popular ? "text-neon-cyan" : "text-white/50"} />
                      </div>
                      <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-extrabold font-display">
                        {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString("id-ID")}`}
                      </span>
                      {plan.price > 0 && <span className="text-xs text-white/30 ml-1">/ bulan</span>}
                    </div>

                    <p className="text-sm text-white/40 mb-4">{plan.description}</p>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.split(",").map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm text-white/50">
                          <CheckCircle size={14} className="text-neon-cyan shrink-0 mt-0.5" />
                          <span>{f.trim()}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelect(plan.id)}
                      disabled={loadingPlan === plan.id}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                        plan.popular ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <span className={plan.popular ? "shine" : ""} />
                          Pilih Paket
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* FAQ */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-20 max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-10">Pertanyaan Umum</h2>
            <div className="space-y-4">
              {[
                { q: "Apakah ada masa uji coba untuk paket berbayar?", a: "Tidak ada masa uji coba khusus, namun kamu bisa mulai dari paket Gratis dan upgrade kapan saja." },
                { q: "Bagaimana cara mengganti paket?", a: "Kamu bisa upgrade atau downgrade paket kapan saja dari halaman Dashboard. Perubahan berlaku untuk siklus penagihan berikutnya." },
                { q: "Metode pembayaran apa yang diterima?", a: "Kami menerima pembayaran melalui QRIS, transfer bank, dan e-wallet seperti GoPay, OVO, DANA, dan ShopeePay." },
                { q: "Apakah paket Gratis memiliki batasan?", a: "Ya, paket Gratis terbatas pada 5 request/hari, 1 request/menit rate limit, dan 1 API key." },
              ].map((faq) => (
                <div key={faq.q} className="glass-card p-5">
                  <h3 className="font-display font-semibold text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-white/40">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
