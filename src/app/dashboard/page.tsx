"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Key, Plus, Trash2, Power, PowerOff, Copy, BarChart3, Clock, Activity, TrendingUp, LogOut } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  active: boolean;
  rateLimit: number;
  lastUsedAt: string | null;
  createdAt: string;
  _count: { usageLogs: number };
}

interface DashboardData {
  keys: ApiKeyItem[];
  stats: { todayCount: number; weekCount: number; monthCount: number; totalKeys: number };
  dailyUsage: { date: string; count: number }[];
}

export default function DashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.success) setData(d.data); })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const createKey = async () => {
    if (!newKeyName.trim() || !token) return;
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newKeyName }),
    });
    const d = await res.json();
    if (d.success) {
      setNewKeyName("");
      setShowCreate(false);
      const refreshed = await fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      const rd = await refreshed.json();
      if (rd.success) setData(rd.data);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Hapus kunci API ini?") || !token) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const refreshed = await fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
    const rd = await refreshed.json();
    if (rd.success) setData(rd.data);
  };

  const toggleKey = async (id: string, active: boolean) => {
    if (!token) return;
    await fetch(`/api/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    const refreshed = await fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
    const rd = await refreshed.json();
    if (rd.success) setData(rd.data);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-sm text-white/30">Selamat datang kembali, {user.name}. Berikut ringkasan API kamu.</p>
          </div>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Activity, label: "Hari Ini", value: data?.stats.todayCount ?? 0, color: "text-neon-cyan" },
            { icon: TrendingUp, label: "Minggu Ini", value: data?.stats.weekCount ?? 0, color: "text-neon-magenta" },
            { icon: BarChart3, label: "Bulan Ini", value: data?.stats.monthCount ?? 0, color: "text-neon-lime" },
            { icon: Key, label: "Kunci Aktif", value: data?.stats.totalKeys ?? 0, color: "text-neon-purple" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon size={18} className={s.color} />
                <span className="text-xs text-white/20">{s.label}</span>
              </div>
              <div className="text-2xl font-extrabold font-display">{s.value.toLocaleString()}</div>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Penggunaan API (7 Hari Terakhir)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyUsage ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Bar dataKey="count" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#ff00aa" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* API Keys */}
        <div id="keys">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Kunci API</h3>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
              <span className="shine" />
              <Plus size={14} />
              Buat Kunci Baru
            </button>
          </div>

          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-4 flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Nama kunci (misal: Produksi)"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
              />
              <button onClick={createKey} className="btn-primary text-sm py-2 px-4">Buat</button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost text-sm py-2 px-4">Batal</button>
            </motion.div>
          )}

          <div className="space-y-3">
            {data?.keys.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{k.name}</span>
                    <span className={`badge ${k.active ? "badge-developer" : "badge-closed"}`}>
                      {k.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-neon-cyan/70 truncate">{k.key}</code>
                    <button onClick={() => copyKey(k.key)} className="text-white/20 hover:text-neon-cyan transition-colors shrink-0">
                      <Copy size={12} />
                    </button>
                    {copied === k.key && <span className="text-xs text-green-400">Disalin!</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/20">
                    <span>Batas: {k.rateLimit} RPM</span>
                    <span>Permintaan: {k._count.usageLogs}</span>
                    <span>Terakhir digunakan: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Belum Pernah"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleKey(k.id, k.active)}
                    className={`p-2 rounded-lg transition-colors ${k.active ? "text-yellow-400 hover:bg-yellow-500/10" : "text-green-400 hover:bg-green-500/10"}`}
                    title={k.active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {k.active ? <PowerOff size={14} /> : <Power size={14} />}
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
            {data?.keys.length === 0 && (
              <div className="glass-card p-8 text-center text-white/20 text-sm">
                Belum ada kunci API. Buat kunci API pertama kamu untuk memulai.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
