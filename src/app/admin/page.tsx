"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Users, Key, Activity, BarChart3, Shield, Settings, DollarSign, TrendingUp, ShoppingCart, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface AdminData {
  stats: { totalUsers: number; totalKeys: number; totalRequests: number; todayRequests: number; activeKeys: number };
  dailyUsage: { date: string; requests: number }[];
  tierDistribution: { tier: string; _count: number }[];
  recentLogs: any[];
}

interface RevenueData {
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    thisYear: number;
    totalTransactions: number;
    todayTransactions: number;
    monthTransactions: number;
    yearTransactions: number;
  };
  revenueByPlan: { planId: string; planName: string; price: number; totalRevenue: number; totalSales: number }[];
  daily: { date: string; revenue: number; transactions: number }[];
  monthly: { month: string; revenue: number; transactions: number }[];
  transactions: any[];
}

const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token && user?.role === "admin") {
      Promise.all([
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/admin/revenue?action=stats", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/admin/revenue?action=daily&days=30", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/admin/revenue?action=by-plan", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/admin/revenue?action=transactions&limit=10", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]).then(([statsRes, revenueRes, dailyRes, byPlanRes, transRes]) => {
        if (statsRes.success) setData(statsRes.data);
        if (revenueRes.success && dailyRes.success && byPlanRes.success && transRes.success) {
          setRevenue({
            revenue: revenueRes.data.revenue,
            revenueByPlan: byPlanRes.data.revenueByPlan,
            daily: dailyRes.data.daily,
            monthly: [],
            transactions: transRes.data.transactions,
          });
        }
      }).finally(() => setLoading(false));
    }
  }, [token, user]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  const COLORS = ["#00f0ff", "#ff00aa", "#b8ff00", "#a855f7", "#f97316"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-neon-lime" />
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-white/30">System overview & revenue dashboard</p>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Total Penghasilan", value: formatRupiah(revenue?.revenue.total ?? 0), color: "text-neon-lime", sub: `${revenue?.revenue.totalTransactions ?? 0} transaksi` },
            { icon: TrendingUp, label: "Hari Ini", value: formatRupiah(revenue?.revenue.today ?? 0), color: "text-neon-cyan", sub: `${revenue?.revenue.todayTransactions ?? 0} transaksi` },
            { icon: Calendar, label: "Bulan Ini", value: formatRupiah(revenue?.revenue.thisMonth ?? 0), color: "text-neon-magenta", sub: `${revenue?.revenue.monthTransactions ?? 0} transaksi` },
            { icon: BarChart3, label: "Tahun Ini", value: formatRupiah(revenue?.revenue.thisYear ?? 0), color: "text-yellow-400", sub: `${revenue?.revenue.yearTransactions ?? 0} transaksi` },
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
              <div className="text-xl font-extrabold font-display">{s.value}</div>
              <div className="text-xs text-white/30 mt-1">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Users, label: "Total Users", value: data?.stats.totalUsers ?? 0, color: "text-neon-cyan" },
            { icon: Key, label: "Total Keys", value: data?.stats.totalKeys ?? 0, color: "text-neon-magenta" },
            { icon: Activity, label: "Total Requests", value: data?.stats.totalRequests ?? 0, color: "text-neon-lime" },
            { icon: BarChart3, label: "Today Requests", value: data?.stats.todayRequests ?? 0, color: "text-neon-purple" },
            { icon: Settings, label: "Active Keys", value: data?.stats.activeKeys ?? 0, color: "text-green-400" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
          {/* Daily Revenue Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Penghasilan 30 Hari Terakhir</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue?.daily ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(value: number) => [formatRupiah(value), "Penghasilan"]}
                  />
                  <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8ff00" />
                      <stop offset="100%" stopColor="#00f0ff" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Revenue by Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Penghasilan per Paket</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenue?.revenueByPlan.map((p) => ({ name: p.planName, value: p.totalRevenue })) ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenue?.revenueByPlan.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(value: number) => [formatRupiah(value), "Penghasilan"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {revenue?.revenueByPlan.map((p, i) => (
                <div key={p.planId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-white/40">{p.planName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 font-medium">{formatRupiah(p.totalRevenue)}</div>
                    <div className="text-white/20">{p.totalSales} penjualan</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Daily Usage Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Daily API Usage (14 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyUsage ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="requests" stroke="#00f0ff" strokeWidth={2} dot={{ fill: "#00f0ff", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Tier Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Tier Distribution</h3>
            <div className="h-64">
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

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Transaksi Terakhir</h3>
            <a href="/admin/plans" className="text-xs text-neon-cyan hover:underline">Lihat Semua</a>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Paket</th>
                  <th>Harga</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {revenue?.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-sm">{tx.user?.name || "Unknown"}</td>
                    <td className="text-sm">{tx.plan?.name || "Unknown"}</td>
                    <td className="text-sm font-medium text-neon-lime">{formatRupiah(tx.amount)}</td>
                    <td>
                      <span className={`badge ${tx.status === "paid" ? "badge-open" : tx.status === "pending" ? "badge-developer" : "badge-closed"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="text-xs text-white/30">{tx.paidAt ? new Date(tx.paidAt).toLocaleString("id-ID") : "-"}</td>
                  </tr>
                ))}
                {revenue?.transactions.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-white/20 py-8">Belum ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-6">
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
