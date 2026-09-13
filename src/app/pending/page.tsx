"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Shield, Mail, LogOut, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function PendingPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.role === "admin") router.push("/admin");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token || !user) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          const u = data.data.user;
          if (u.role === "admin") {
            clearInterval(interval);
            router.push("/admin");
          } else if (u.status === "active") {
            clearInterval(interval);
            if (u.planId) {
              router.push("/dashboard");
            } else {
              router.push("/dashboard/plan");
            }
          } else if (u.status === "rejected") {
            clearInterval(interval);
            logout();
            router.push("/auth/login?error=rejected");
          }
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [token, user, router, logout]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark pt-16">
      <section className="relative py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-10"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Clock size={36} className="text-yellow-400 animate-pulse" />
            </div>

            <h1 className="font-display text-2xl font-bold mb-3">Menunggu Persetujuan</h1>
            <p className="text-white/40 mb-6 leading-relaxed">
              Akun kamu <span className="text-white/70 font-medium">{user.email}</span> sedang menunggu persetujuan dari admin.
              Proses ini biasanya memakan waktu 1×24 jam.
            </p>

            <div className="space-y-3 text-left mb-8">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <CheckCircle size={16} className="text-green-400 shrink-0" />
                <span className="text-sm text-white/60">Registrasi berhasil</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock size={16} className="text-yellow-400 shrink-0" />
                <span className="text-sm text-yellow-300/80">Menunggu persetujuan admin</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 opacity-40">
                <Shield size={16} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/40">Pilih paket & pembayaran</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 opacity-40">
                <Mail size={16} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/40">Mulai menggunakan API</span>
              </div>
            </div>

            <p className="text-xs text-white/20 mb-6">
              Halaman ini akan otomatis memperbarui status kamu. Jika sudah di-approve, kamu akan diarahkan ke halaman berikutnya.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
