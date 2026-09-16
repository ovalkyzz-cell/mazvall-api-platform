"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Loader2, Copy, ArrowRight, RefreshCw } from "lucide-react";

interface PaymentStatus {
  status: "pending" | "success" | "expired";
  qrUrl?: string;
  amount?: number;
  originalAmount?: number;
  discountPercentage?: number;
  discountCode?: string;
  planName?: string;
  apiKey?: string;
  expiresAt?: string;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get("transactionId");
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(900);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!transactionId) return;
    try {
      const savedToken = localStorage.getItem("mazvall_token");
      const headers: Record<string, string> = {};
      if (savedToken) headers["Authorization"] = `Bearer ${savedToken}`;
      const res = await fetch(`/api/payment/status?transactionId=${transactionId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setPayment(data.data);
        if (data.data.status === "success" || data.data.status === "expired") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      return;
    }
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPayment((p) => (p ? { ...p, status: "expired" } : p));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [transactionId, fetchStatus]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!transactionId) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">
          <p className="text-white/40">Transaction ID tidak ditemukan.</p>
          <Link href="/pricing" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm py-3 px-6">
            <span className="shine" />
            Kembali ke Pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative min-h-screen pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] morph-blob" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-magenta/5 rounded-full filter blur-[100px] morph-blob" style={{ animationDelay: "-5s" }} />
        </div>

        <div className="relative z-10 max-w-lg mx-auto px-4">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-32">
              <Loader2 size={32} className="animate-spin text-neon-cyan mx-auto mb-4" />
              <p className="text-white/40">Memuat status pembayaran...</p>
            </motion.div>
          ) : payment?.status === "pending" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium mb-4">
                  <Clock size={12} />
                  Menunggu Pembayaran
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">Selesaikan Pembayaran</h1>
                <p className="text-sm text-white/40">Scan QR code di bawah ini untuk menyelesaikan pembayaran</p>
              </div>

              <div className="glass-card p-8 text-center">
                {payment.qrUrl && (
                  <div className="inline-block p-4 bg-white rounded-2xl mb-6">
                    <img src={payment.qrUrl} alt="QR Code Pembayaran" className="w-56 h-56 object-contain" />
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Total Pembayaran</p>
                  <p className="text-3xl font-extrabold font-display gradient-text">
                    Rp {(payment.amount ?? 0).toLocaleString("id-ID")}
                  </p>
                  {payment.originalAmount && payment.originalAmount > (payment.amount ?? 0) && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-sm text-white/30 line-through">
                        Rp {payment.originalAmount.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neon-lime/10 text-neon-lime font-medium">
                        Diskon {payment.discountPercentage}%
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-white/30 mt-1">{payment.planName}</p>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock size={14} className="text-yellow-400" />
                    <span className="text-sm text-white/50">Sisa waktu</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-yellow-400">{formatCountdown(countdown)}</p>
                </div>

                <div className="text-left space-y-3 text-sm text-white/40">
                  <p className="font-medium text-white/60">Cara Pembayaran:</p>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Buka aplikasi mobile banking atau e-wallet</li>
                    <li>Pilih menu scan QR atau QRIS</li>
                    <li>Scan QR code di atas</li>
                    <li>Konfirmasi pembayaran sesuai nominal</li>
                    <li>Pembayaran akan terverifikasi otomatis</li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button onClick={fetchStatus} className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1 mx-auto">
                  <RefreshCw size={12} /> Refresh status
                </button>
              </div>
            </motion.div>
          ) : payment?.status === "success" ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-16 text-center">
              <div className="glass-card p-10">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-400" />
                </div>
                <h1 className="font-display text-3xl font-bold mb-3">Pembayaran Berhasil!</h1>
                <p className="text-white/40 mb-8">Akun kamu telah di-upgrade. Selamat menikmati fitur premium.</p>

                {payment.apiKey && (
                  <div className="mb-8">
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Kunci API Kamu</p>
                    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/10">
                      <code className="text-sm font-mono text-neon-cyan">{payment.apiKey}</code>
                      <button onClick={() => copyApiKey(payment.apiKey!)} className="text-white/30 hover:text-white/60 transition-colors">
                        {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    {copied && <p className="text-xs text-green-400 mt-2">Berhasil disalin!</p>}
                  </div>
                )}

                <Link
                  href="/dashboard"
                  className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-8"
                >
                  <span className="shine" />
                  Masuk ke Dashboard
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ) : payment?.status === "expired" ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-16 text-center">
              <div className="glass-card p-10">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <XCircle size={40} className="text-red-400" />
                </div>
                <h1 className="font-display text-3xl font-bold mb-3">Pembayaran Kedaluwarsa</h1>
                <p className="text-white/40 mb-8">Waktu pembayaran telah habis. Silakan buat pesanan baru.</p>

                <Link
                  href="/pricing"
                  className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-8"
                >
                  <span className="shine" />
                  Coba Lagi
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-16 text-center">
              <p className="text-white/40">Status tidak diketahui.</p>
              <Link href="/pricing" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm py-3 px-6">
                <span className="shine" />
                Kembali ke Pricing
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neon-cyan" size={32} /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
