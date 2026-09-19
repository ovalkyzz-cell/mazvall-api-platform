"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Zap,
  Star,
  ArrowRight,
  Loader2,
  Crown,
  Building2,
  Tag,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Plan {
  id: string;
  name: string;
  price: number;
  requestsPerDay: number;
  requestsPerMin: number;
  description: string;
  features: string;
  featureAccess: string;
  popular: boolean;
  active: boolean;
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
  const [loadingCoupon, setLoadingCoupon] = useState<string | null>(null);

  const [discountCodes, setDiscountCodes] = useState<Record<string, string>>({});
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, any>>({});
  const [couponErrors, setCouponErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => {
        console.log("PLANS DATA:", d);
        if (d.success) setPlans(d.data);
      })
      .catch((e) => console.error("PLANS ERROR:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleApplyCoupon = async (plan: Plan) => {
    const code = discountCodes[plan.id] || "";
    if (!code.trim()) {
      setCouponErrors({ ...couponErrors, [plan.id]: "Masukkan kode diskon" });
      return;
    }

    setLoadingCoupon(plan.id);
    setCouponErrors({ ...couponErrors, [plan.id]: "" });

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), planId: plan.id }),
      });
      const data = await res.json();

      if (data.success && data.data?.valid) {
        setAppliedCoupons({
          ...appliedCoupons,
          [plan.id]: {
            code: data.data.code,
            discountType: data.data.discountType,
            discountValue: data.data.discountValue,
          },
        });
        setCouponErrors({ ...couponErrors, [plan.id]: "" });
        toast.success("Diskon berhasil diterapkan!");
      } else {
        setCouponErrors({
          ...couponErrors,
          [plan.id]: data.data?.error || data.error || "Kode diskon tidak valid",
        });
        const newApplied = { ...appliedCoupons };
        delete newApplied[plan.id];
        setAppliedCoupons(newApplied);
      }
    } catch {
      setCouponErrors({
        ...couponErrors,
        [plan.id]: "Gagal memvalidasi kode diskon",
      });
    } finally {
      setLoadingCoupon(null);
    }
  };

  const handleRemoveCoupon = (planId: string) => {
    const newApplied = { ...appliedCoupons };
    delete newApplied[planId];
    setAppliedCoupons(newApplied);
    setDiscountCodes({ ...discountCodes, [planId]: "" });
    setCouponErrors({ ...couponErrors, [planId]: "" });
  };

  const calculateDiscountAmount = (price: number, coupon: any) => {
    if (!coupon) return 0;
    if (coupon.discountType === "percentage") {
      return Math.floor((price * coupon.discountValue) / 100);
    }
    return coupon.discountValue;
  };

  const calculateFinalPrice = (price: number, coupon: any) => {
    return Math.max(0, price - calculateDiscountAmount(price, coupon));
  };

  const handleSelect = async (plan: Plan) => {
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
    if (plan.price === 0) {
      processPayment(plan.id, null);
      return;
    }
    processPayment(plan.id, appliedCoupons[plan.id]?.code || null);
  };

  const processPayment = async (planId: string, couponCodeStr: string | null) => {
    setLoadingPlan(planId);
    try {
      const body: { planId: string; couponCode?: string } = { planId };
      if (couponCodeStr) body.couponCode = couponCodeStr;

      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.data?.transactionId) {
        router.push(`/payment?transactionId=${data.data.transactionId}`);
      }
    } catch {
      // silent
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative min-h-screen pt-24 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] morph-blob" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-magenta/5 rounded-full filter blur-[100px] morph-blob" style={{ animationDelay: "-5s" }} />
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
              Mulai gratis dan upgrade sesuai kebutuhan.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/40 mt-4 text-sm">Memuat paket...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {plans.filter(p => p.active).map((plan, i) => {
                const Icon = planIcon(plan.name);
                const hasCoupon = !!appliedCoupons[plan.id];
                const finalPrice = calculateFinalPrice(plan.price, appliedCoupons[plan.id]);
                const discountAmount = calculateDiscountAmount(plan.price, appliedCoupons[plan.id]);

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
                      {hasCoupon && plan.price > 0 ? (
                        <>
                          <span className="text-sm text-white/40 line-through block">Rp {plan.price.toLocaleString("id-ID")}</span>
                          <span className="text-3xl font-extrabold font-display text-neon-cyan">
                            Rp {finalPrice.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs text-white/30 ml-1">/ bulan</span>
                          <div className="text-sm text-neon-lime font-semibold mt-1">
                            Hemat Rp {discountAmount.toLocaleString("id-ID")}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold font-display">
                            {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString("id-ID")}`}
                          </span>
                          {plan.price > 0 && <span className="text-xs text-white/30 ml-1">/ bulan</span>}
                        </>
                      )}
                    </div>

                    <p className="text-sm text-white/40 mb-4">{plan.description}</p>

                    <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Akses Fitur</p>
                      <p className="text-sm font-medium text-white/70">
                        {plan.featureAccess === "all" ? "Seluruh Endpoint" : plan.featureAccess.split(",").map(s => s.trim() === "ai" ? "AI" : s.trim() === "tempmail" ? "TempMail" : s.trim()).join(", ")}
                      </p>
                    </div>

                    <ul className="space-y-2.5 mb-4 flex-1">
                      {plan.features.split(",").map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm text-white/50">
                          <CheckCircle size={14} className="text-neon-cyan shrink-0 mt-0.5" />
                          <span>{f.trim()}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.price > 0 && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                        <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
                          <Tag size={13} className="text-neon-cyan" />
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Gunakan Kode Diskon</span>
                        </div>
                        <div className="p-4">
                          {!hasCoupon ? (
                            <>
                              <div className="flex items-stretch gap-2">
                                <input
                                  type="text"
                                  value={discountCodes[plan.id] || ""}
                                  onChange={(e) => setDiscountCodes({ ...discountCodes, [plan.id]: e.target.value.toUpperCase() })}
                                  placeholder="Masukkan kode"
                                  className="min-w-0 flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleApplyCoupon(plan);
                                  }}
                                />
                                <button
                                  onClick={() => handleApplyCoupon(plan)}
                                  disabled={loadingCoupon === plan.id || !(discountCodes[plan.id] || "").trim()}
                                  className="shrink-0 px-4 py-2.5 rounded-lg bg-neon-cyan text-surface-dark text-xs font-bold hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                                >
                                  {loadingCoupon === plan.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Check size={13} />
                                  )}
                                  Gunakan
                                </button>
                              </div>
                              {couponErrors[plan.id] && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg">
                                  <AlertCircle size={12} />
                                  <span className="truncate">{couponErrors[plan.id]}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-neon-lime/10 border border-neon-lime/20">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="shrink-0 w-7 h-7 rounded-full bg-neon-lime/20 flex items-center justify-center">
                                  <Check size={14} className="text-neon-lime" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm font-mono font-bold text-neon-lime block truncate">
                                    {appliedCoupons[plan.id].code}
                                  </span>
                                  <span className="text-xs text-white/40">
                                    {appliedCoupons[plan.id].discountType === "percentage"
                                      ? `-${appliedCoupons[plan.id].discountValue}%`
                                      : `-Rp ${appliedCoupons[plan.id].discountValue.toLocaleString("id-ID")}`}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveCoupon(plan.id)}
                                className="shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleSelect(plan)}
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
                          {plan.price === 0 ? "Mulai Gratis" : "Bayar Sekarang"}
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-20 max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-10">Pertanyaan Umum</h2>
            <div className="space-y-4">
              {[
                { q: "Bagaimana cara menggunakan kode diskon?", a: "Masukkan kode diskon di kolom 'KODE DISKON' pada paket yang dipilih, lalu klik 'Gunakan'. Harga akan otomatis terpotong sebelum pembayaran." },
                { q: "Metode pembayaran apa yang diterima?", a: "Kami menerima pembayaran melalui QRIS, transfer bank, dan e-wallet seperti GoPay, OVO, DANA, dan ShopeePay." },
                { q: "Bagaimana cara mengganti paket?", a: "Kamu bisa upgrade atau downgrade paket kapan saja dari halaman Dashboard." },
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
