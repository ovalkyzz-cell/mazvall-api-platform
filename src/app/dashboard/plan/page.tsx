"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket, Building2, ArrowRight, LogOut, Ticket, Loader2 } from "lucide-react";

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
  active: boolean;
}

interface CouponResult {
  valid: boolean;
  code?: string;
  discountType?: string;
  discountValue?: number;
  originalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
}

export default function PlanSelectionPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.role === "admin") router.push("/admin");
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

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setCouponLoading(true);
    setCouponResult(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode.trim(), planId: selectedPlan }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCouponResult(data.data);
        setCouponApplied(data.data.valid);
      } else {
        setCouponResult({ valid: false, error: data.message || "Kode tidak valid" });
        setCouponApplied(false);
      }
    } catch {
      setCouponResult({ valid: false, error: "Gagal memvalidasi kode" });
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode("");
    setCouponResult(null);
    setCouponApplied(false);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!token || purchasing) return;
    setPurchasing(true);
    try {
      const plan = plans.find(p => p.id === planId);
      if (plan && plan.price === 0) {
        const res = await fetch("/api/plan/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.error || "Gagal aktivasi");
        }
      } else {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planId, couponCode: couponApplied ? couponCode.trim() : undefined }),
        });
        const data = await res.json();
        if (data.success && data.data.transactionId) {
          router.push(`/payment?transactionId=${data.data.transactionId}`);
        } else {
          alert(data.error || "Gagal membuat transaksi");
        }
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

          {/* Coupon Input */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mb-8">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket size={14} className="text-neon-lime" />
                <span className="text-xs text-white/40">Punya kode diskon?</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); if (couponApplied) clearCoupon(); }}
                  placeholder="Masukkan kode diskon"
                  disabled={!selectedPlan}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:outline-none focus:border-neon-cyan/50 placeholder:text-white/20 disabled:opacity-30"
                />
                <button
                  onClick={validateCoupon}
                  disabled={couponLoading || !couponCode.trim() || !selectedPlan}
                  className="px-4 py-2 bg-neon-cyan/10 text-neon-cyan text-sm font-medium rounded-lg hover:bg-neon-cyan/20 transition-colors disabled:opacity-30 flex items-center gap-1.5"
                >
                  {couponLoading ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
                  Pakai
                </button>
              </div>
              {!selectedPlan && (
                <p className="text-xs text-white/20 mt-2">Pilih paket terlebih dahulu</p>
              )}
              {couponResult && (
                <div className={`mt-2 p-2 rounded-lg text-xs ${couponResult.valid ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {couponResult.valid ? (
                    <div>
                      <span className="font-medium">Diskon berhasil!</span> Hemat Rp {(couponResult.discountAmount || 0).toLocaleString("id-ID")}
                      <span className="text-white/30 ml-1">({couponResult.discountType === "percentage" ? `${couponResult.discountValue}%` : `Rp ${(couponResult.discountValue || 0).toLocaleString()}`})</span>
                    </div>
                  ) : (
                    <span>{couponResult.error}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.filter(p => p.active).map((plan, i) => {
                const isSelected = selectedPlan === plan.id;
                const hasDiscount = isSelected && couponResult?.valid;
                const displayPrice = hasDiscount ? (couponResult!.finalPrice || plan.price) : plan.price;
                const displayOriginal = hasDiscount ? (couponResult!.originalPrice || plan.price) : plan.price;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => { setSelectedPlan(plan.id); clearCoupon(); }}
                    className={`relative glass-card p-6 flex flex-col cursor-pointer transition-all ${plan.popular ? "border-neon-cyan/30 ring-1 ring-neon-cyan/20" : ""} ${isSelected ? "border-neon-cyan bg-neon-cyan/5" : "hover:border-white/20"}`}
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
                      <div className="flex items-baseline gap-2">
                        {hasDiscount && (
                          <span className="text-sm text-white/30 line-through">Rp {displayOriginal.toLocaleString()}</span>
                        )}
                        <span className="text-3xl font-extrabold font-display">
                          {displayPrice === 0 ? "Gratis" : `Rp ${displayPrice.toLocaleString()}`}
                        </span>
                      </div>
                      {displayPrice > 0 && <span className="text-xs text-white/30">/ bulan</span>}
                      {hasDiscount && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/15 text-green-400 text-xs rounded-full border border-green-500/20">
                          Hemat Rp {(couponResult!.discountAmount || 0).toLocaleString()}
                        </span>
                      )}
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
                      onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan.id); }}
                      disabled={purchasing || !isSelected}
                      className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        isSelected
                          ? plan.popular ? "btn-primary" : "bg-white/10 text-white hover:bg-white/15"
                          : "border border-white/10 text-white/30 cursor-not-allowed"
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
                );
              })}
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
