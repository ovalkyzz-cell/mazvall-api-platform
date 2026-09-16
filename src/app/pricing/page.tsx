"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
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

interface DiscountResult {
  id: string;
  code: string;
  percentage: number;
  description: string | null;
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

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountResult | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlans(d.data); })
      .finally(() => setLoading(false));
  }, []);

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
    setSelectedPlan(plan);
    setDiscountCode("");
    setAppliedDiscount(null);
    setDiscountError("");
    setShowDiscountModal(true);
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Masukkan kode diskon");
      return;
    }
    setValidatingDiscount(true);
    setDiscountError("");
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedDiscount(data.data);
        toast.success(`Diskon ${data.data.percentage}% berhasil diterapkan!`);
      } else {
        setDiscountError(data.error || "Kode diskon tidak valid");
        setAppliedDiscount(null);
      }
    } catch {
      setDiscountError("Gagal memvalidasi kode diskon");
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  const processPayment = async (planId: string, discountCodeStr: string | null) => {
    setLoadingPlan(planId);
    try {
      const body: { planId: string; discountCode?: string } = { planId };
      if (discountCodeStr) body.discountCode = discountCodeStr;

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
      // fallback silently
    } finally {
      setLoadingPlan(null);
      setShowDiscountModal(false);
    }
  };

  const handleConfirmPurchase = () => {
    if (!selectedPlan) return;
    processPayment(selectedPlan.id, appliedDiscount?.code || null);
  };

  const getDiscountedPrice = (plan: Plan, discount: DiscountResult | null) => {
    if (!discount) return plan.price;
    return Math.round(plan.price - (plan.price * discount.percentage) / 100);
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
              Mulai gratis dan upgrade sesuai kebutuhan. Gunakan kode diskon untuk mendapatkan harga spesial.
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

                    {plan.price > 0 && (
                      <div className="flex items-center gap-1.5 mb-4 text-xs text-neon-lime/70">
                        <Tag size={12} />
                        <span>Masukkan kode diskon saat checkout</span>
                      </div>
                    )}

                    <p className="text-sm text-white/40 mb-4">{plan.description}</p>

                    <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Akses Fitur</p>
                      <p className="text-sm font-medium text-white/70">
                        {plan.featureAccess === "all" ? "Seluruh Endpoint" : plan.featureAccess.split(",").map(s => s.trim() === "ai" ? "AI" : s.trim() === "tempmail" ? "TempMail" : s.trim()).join(", ")}
                      </p>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.split(",").map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm text-white/50">
                          <CheckCircle size={14} className="text-neon-cyan shrink-0 mt-0.5" />
                          <span>{f.trim()}</span>
                        </li>
                      ))}
                    </ul>

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
                          {plan.price === 0 ? "Mulai Gratis" : "Pilih Paket"}
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
                { q: "Bagaimana cara menggunakan kode diskon?", a: "Ketika kamu memilih paket berbayar, akan muncul kolom untuk memasukkan kode diskon. Masukkan kode yang valid dan diskon akan langsung diterapkan ke harga yang harus dibayar." },
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

      {/* Discount Modal */}
      <AnimatePresence>
        {showDiscountModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDiscountModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center">
                      <Tag size={18} className="text-neon-cyan" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Checkout</h3>
                      <p className="text-xs text-white/30">{selectedPlan.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDiscountModal(false)}
                    className="text-white/30 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Price Summary */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/50">Harga Paket</span>
                    <span className="font-display font-bold">Rp {selectedPlan.price.toLocaleString("id-ID")}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neon-lime flex items-center gap-1.5">
                        <Tag size={12} />
                        Diskon {appliedDiscount.percentage}%
                      </span>
                      <span className="text-sm text-neon-lime font-bold">
                        - Rp {((selectedPlan.price * appliedDiscount.percentage) / 100).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  {appliedDiscount && (
                    <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">Total Bayar</span>
                      <span className="text-xl font-extrabold font-display gradient-text">
                        Rp {getDiscountedPrice(selectedPlan, appliedDiscount).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  {!appliedDiscount && (
                    <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">Total Bayar</span>
                      <span className="text-xl font-extrabold font-display">
                        Rp {selectedPlan.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Discount Code Input */}
                {!appliedDiscount ? (
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Kode Diskon (Opsional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase());
                          setDiscountError("");
                        }}
                        placeholder="DISCON-MVAL-XXXXX"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-white/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleValidateDiscount();
                        }}
                      />
                      <button
                        onClick={handleValidateDiscount}
                        disabled={validatingDiscount || !discountCode.trim()}
                        className="px-4 py-2.5 rounded-lg bg-neon-cyan/10 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {validatingDiscount ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Gunakan
                      </button>
                    </div>
                    {discountError && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                        <AlertCircle size={12} />
                        {discountError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neon-lime/5 border border-neon-lime/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neon-lime/10 flex items-center justify-center">
                        <Check size={14} className="text-neon-lime" />
                      </div>
                      <div>
                        <code className="text-sm font-mono font-bold text-neon-lime">{appliedDiscount.code}</code>
                        <p className="text-xs text-white/30">Diskon {appliedDiscount.percentage}% diterapkan</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={loadingPlan === selectedPlan.id}
                  className="flex-1 py-3 rounded-xl text-sm font-medium btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingPlan === selectedPlan.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span className="shine" />
                      Bayar Sekarang
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
