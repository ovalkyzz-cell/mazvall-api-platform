"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Users, Key, Activity, BarChart3, Shield, Settings, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminData {
  stats: { totalUsers: number; totalKeys: number; totalRequests: number; todayRequests: number; activeKeys: number };
  dailyUsage: { date: string; requests: number }[];
  tierDistribution: { tier: string; _count: number }[];
  recentLogs: any[];
}

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token && user?.role === "admin") {
      fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.success) setData(d.data); })
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  const COLORS = ["#00f0ff", "#ff00aa", "#b8ff00"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-neon-lime" />
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-white/30">System overview and management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Users, label: "Total Users", value: data?.stats.totalUsers ?? 0, color: "text-neon-cyan" },
            { icon: Key, label: "Total Keys", value: data?.stats.totalKeys ?? 0, color: "text-neon-magenta" },
            { icon: Activity, label: "Total Requests", value: data?.stats.totalRequests ?? 0, color: "text-neon-lime" },
            { icon: BarChart3, label: "Today", value: data?.stats.todayRequests ?? 0, color: "text-neon-purple" },
            { icon: Settings, label: "Active Keys", value: data?.stats.activeKeys ?? 0, color: "text-green-400" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon size={16} className={s.color} />
                <span className="text-xs text-white/20">{s.label}</span>
              </div>
              <div className="text-xl font-extrabold font-display">{s.value.toLocaleString()}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Usage Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Daily API Usage (14 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dailyUsage ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Bar dataKey="requests" fill="url(#adminGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8ff00" />
                      <stop offset="100%" stopColor="#00f0ff" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Tier Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Tier Distribution</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.tierDistribution.map((t) => ({ name: t.tier, value: t._count })) ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.tierDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {data?.tierDistribution.map((t, i) => (
                <div key={t.tier} className="flex items-center gap-2 text-xs text-white/40">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  {t.tier} ({t._count})
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Recent API Activity</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>API Key</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-sm">{log.user?.name || "Unknown"}</td>
                    <td className="text-xs font-mono text-neon-cyan/60">{log.apiKey?.name}</td>
                    <td className="text-xs font-mono">{log.endpoint}</td>
                    <td><span className="badge badge-developer">{log.method}</span></td>
                    <td><span className={`badge ${log.status === 200 ? "badge-open" : "badge-closed"}`}>{log.status}</span></td>
                    <td className="text-xs text-white/30">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {data?.recentLogs.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-white/20 py-8">No activity yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
