"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Search, Key, CheckCircle, XCircle, User, Mail, Shield,
  Clock, Activity, AlertTriangle, Copy, Loader2
} from "lucide-react";

interface KeyCheckResult {
  found: boolean;
  key: string;
  status: "active" | "inactive";
  message: string;
  details?: {
    name: string;
    rateLimit: number;
    active: boolean;
    expired: boolean;
    expiresAt: string | null;
    createdAt: string;
    lastUsedAt: string | null;
    usageToday: number;
    user: {
      name: string;
      email: string;
      role: string;
      tier: string;
      status: string;
    };
  };
}

interface UserKey {
  id: string;
  key: string;
  name: string;
  active: boolean;
  rateLimit: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  status: string;
  createdAt: string;
  apiKeys: UserKey[];
}

export default function CheckKeyPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchKey, setSearchKey] = useState("");
  const [result, setResult] = useState<KeyCheckResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  const checkKey = async () => {
    if (!searchKey.trim() || !token) return;
    setSearching(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/check-key?key=${encodeURIComponent(searchKey.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch {
      setResult({ found: false, key: searchKey, status: "inactive", message: "Gagal menghubungi server" });
    } finally {
      setSearching(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-neon-cyan" />
          <div>
            <h1 className="font-display text-2xl font-bold">Cek Status API Key</h1>
            <p className="text-sm text-white/30">Masukkan API key untuk mengecek status aktif/tidak aktif</p>
          </div>
        </div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkKey()}
                placeholder="Masukkan API key (contoh: MVAL-XXXXX)"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
              />
            </div>
            <button
              onClick={checkKey}
              disabled={searching || !searchKey.trim()}
              className="btn-primary py-3 px-6 flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              <span className="shine" />
              {searching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengecek...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Cek Key
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            {/* Status Banner */}
            <div className={`p-6 ${result.status === "active" ? "bg-green-500/10 border-b border-green-500/20" : "bg-red-500/10 border-b border-red-500/20"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.status === "active" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  {result.status === "active" ? (
                    <CheckCircle size={32} className="text-green-400" />
                  ) : (
                    <XCircle size={32} className="text-red-400" />
                  )}
                </div>
                <div>
                  <h2 className={`text-xl font-display font-bold ${result.status === "active" ? "text-green-400" : "text-red-400"}`}>
                    {result.message}
                  </h2>
                  <p className="text-sm text-white/40 mt-1 font-mono">{result.key}</p>
                </div>
                <button
                  onClick={() => copyKey(result.key)}
                  className="ml-auto p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Salin key"
                >
                  {copiedKey ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} className="text-white/30" />
                  )}
                </button>
              </div>
            </div>

            {/* Details */}
            {result.found && result.details && (
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                    <User size={14} />
                    Informasi User
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard icon={User} label="Nama" value={result.details.user.name} />
                    <InfoCard icon={Mail} label="Email" value={result.details.user.email} />
                    <InfoCard icon={Shield} label="Role" value={result.details.user.role} badge />
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-white/30" />
                        <span className="text-xs text-white/30">Tier</span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        result.details.user.tier === "enterprise"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                          : result.details.user.tier === "developer"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                          : "bg-white/10 text-white/50 border border-white/10"
                      }`}>
                        {result.details.user.tier}
                      </span>
                    </div>
                    <InfoCard
                      icon={result.details.user.status === "active" ? CheckCircle : XCircle}
                      label="Status User"
                      value={result.details.user.status === "active" ? "Aktif" : result.details.user.status}
                      highlight={result.details.user.status === "active" ? "green" : "red"}
                    />
                  </div>
                </div>

                {/* Key Info */}
                <div>
                  <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                    <Key size={14} />
                    Informasi Key
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard icon={Key} label="Nama Key" value={result.details.name} />
                    <InfoCard icon={Activity} label="Rate Limit" value={`${result.details.rateLimit} RPM`} />
                    <InfoCard
                      icon={result.details.active ? CheckCircle : XCircle}
                      label="Key Status"
                      value={result.details.active ? "Aktif" : "Revoked"}
                      highlight={result.details.active ? "green" : "red"}
                    />
                    <InfoCard
                      icon={result.details.expired ? AlertTriangle : Clock}
                      label="Expires"
                      value={result.details.expiresAt ? new Date(result.details.expiresAt).toLocaleDateString("id-ID") : "Tidak ada"}
                      highlight={result.details.expired ? "red" : undefined}
                    />
                    <InfoCard icon={Clock} label="Dibuat" value={new Date(result.details.createdAt).toLocaleDateString("id-ID")} />
                    <InfoCard
                      icon={Clock}
                      label="Terakhir Dipakai"
                      value={result.details.lastUsedAt ? new Date(result.details.lastUsedAt).toLocaleString("id-ID") : "Belum pernah"}
                    />
                    <InfoCard icon={Activity} label="Penggunaan Hari Ini" value={`${result.details.usageToday} request`} />
                  </div>
                </div>
              </div>
            )}

            {/* Key not found */}
            {!result.found && (
              <div className="p-6">
                <div className="glass-card p-8 text-center">
                  <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                  <p className="text-white/50 text-sm">
                    Key <span className="font-mono text-neon-cyan">{searchKey}</span> tidak ditemukan di database.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  badge,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  badge?: boolean;
  highlight?: "green" | "red" | "blue";
}) {
  const highlightColors = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-white/30" />
        <span className="text-xs text-white/30">{label}</span>
      </div>
      <p className={`text-sm font-medium truncate ${highlight ? highlightColors[highlight] : "text-white/70"}`}>
        {value}
      </p>
    </div>
  );
}
