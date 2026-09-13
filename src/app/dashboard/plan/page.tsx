"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket, Building2, ArrowRight, LogOut } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  requestsPerDay: number;
  requestsPerMin: number;
  description: string;
  features: string;
  popular: boolean;
}

export default function PlanSelectionPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.status === "pending") router.push("/pending");
    if (!authLoading && user?.status === "banned") { logout(); router.push("/auth/login?error=banned"); }
    if (!authLoading && user?.status === "rejected") { logout(); router.push("/auth/login?error=rejected"); }
  }, [user, authLoading, router, logout]);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlans(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!token || purchasing) return;
    setPurchasing(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.success && data.data.transactionId) {
        router.push(`/payment?transactionId=${data.data.transactionId}`);
      } else {
        alert(data.error || "Gagal membuat transaksi");
      }
    } catch {
      alert("Terjadi kesalahan");
    } finally {
      setPurchasing(false);
    }
  };

  const planIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "gratis": return <Zap size={20} />;
      case "starter": return <Rocket size={20} />;
      case "pro": return <Crown size={20} />;
      case "business": return <Building2 size={20} />;
      default: return <Zap size={20} />;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark pt-16">
      <section className="relative py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold mb-3">Pilih Paket API</h1>
            <p className="text-white/40 max-w-md mx-auto">
              Selamat datang, <span className="text-white/70 font-medium">{user.name}</span>! Akun kamu sudah aktif.
              Pilih paket yang sesuai kebutuhanmu untuk mulai menggunakan API.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.filter(p => p.active).map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative glass-card p-6 flex flex-col ${plan.popular ? "border-neon-cyan/30 ring-1 ring-neon-cyan/20" : ""} ${selectedPlan === plan.id ? "border-neon-cyan" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-neon-cyan text-surface-dark text-xs font-bold rounded-full">
                      POPULER
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.popular ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/40"}`}>
                      {planIcon(plan.name)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-white/30">{plan.requestsPerDay.toLocaleString()}/hari</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold font-display">
                      {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && <span className="text-xs text-white/30 ml-1">/ bulan</span>}
                  </div>

                  <p className="text-sm text-white/40 mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.split(",").map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm text-white/50">
                        <Check size={14} className="text-neon-cyan shrink-0" />
                        {f.trim()}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={purchasing}
                    className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      plan.popular
                        ? "btn-primary"
                        : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                    } ${purchasing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {purchasing ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {plan.price === 0 ? "Mulai Gratis" : "Pilih & Bayar"}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Kembali ke beranda
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
