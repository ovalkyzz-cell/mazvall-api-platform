"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Monitor, Users, Key, Activity, Clock, RefreshCw,
  TrendingUp, Zap, Shield, CheckCircle, XCircle, Ban,
  BarChart3, ArrowUp, ArrowDown
} from "lucide-react";

interface MonitorData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    bannedUsers: number;
    totalKeys: number;
    activeKeys: number;
    todayRequests: number;
    hourRequests: number;
    minRequests: number;
    rps: number;
  };
  recentLogs: any[];
  topUsers: { id: string; name: string; email: string; tier: string; requestCount: number }[];
  tierDistribution: { tier: string; _count: number }[];
  statusDistribution: { status: string; _count: number }[];
  timestamp: string;
}

export default function MonitorPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [prevToday, setPrevToday] = useState(0);
  const [prevHour, setPrevHour] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/monitor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        setData((prev) => {
          setPrevToday(prev?.overview.todayRequests || 0);
          setPrevHour(prev?.overview.hourRequests || 0);
          return d.data;
        });
        setLastRefresh(new Date());
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  const o = data?.overview;
  const todayDelta = (o?.todayRequests || 0) - prevToday;
  const hourDelta = (o?.hourRequests || 0) - prevHour;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Monitor size={24} className="text-neon-lime" />
            <div>
              <h1 className="font-display text-2xl font-bold">Real-Time Monitor</h1>
              <p className="text-sm text-white/30">
                Auto-refresh: {autoRefresh ? "ON" : "OFF"} • Last: {lastRefresh.toLocaleTimeString("id-ID")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                autoRefresh
                  ? "bg-green-500/15 text-green-400 border border-green-500/20"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              <Activity size={14} className={autoRefresh ? "animate-pulse" : ""} />
              {autoRefresh ? "Live" : "Paused"}
            </button>
            <button onClick={fetchData} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Users} label="Total Users" value={o?.totalUsers ?? 0} color="text-neon-cyan" />
          <StatCard icon={CheckCircle} label="Active Users" value={o?.activeUsers ?? 0} color="text-green-400" />
          <StatCard icon={Clock} label="Pending" value={o?.pendingUsers ?? 0} color="text-yellow-400" />
          <StatCard icon={Ban} label="Banned" value={o?.bannedUsers ?? 0} color="text-red-400" />
          <StatCard icon={Key} label="Active Keys" value={o?.activeKeys ?? 0} color="text-neon-magenta" />
          <StatCard icon={Zap} label="RPS" value={o?.rps ?? 0} color="text-neon-lime" decimals />
        </div>

        {/* Request Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/30">Today Requests</span>
              {todayDelta > 0 ? (
                <span className="text-xs text-green-400 flex items-center gap-0.5"><ArrowUp size={10} />+{todayDelta}</span>
              ) : todayDelta < 0 ? (
                <span className="text-xs text-red-400 flex items-center gap-0.5"><ArrowDown size={10} />{todayDelta}</span>
              ) : null}
            </div>
            <p className="text-3xl font-extrabold font-display">{(o?.todayRequests ?? 0).toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/30">This Hour</span>
              {hourDelta > 0 ? (
                <span className="text-xs text-green-400 flex items-center gap-0.5"><ArrowUp size={10} />+{hourDelta}</span>
              ) : hourDelta < 0 ? (
                <span className="text-xs text-red-400 flex items-center gap-0.5"><ArrowDown size={10} />{hourDelta}</span>
              ) : null}
            </div>
            <p className="text-3xl font-extrabold font-display">{(o?.hourRequests ?? 0).toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/30">This Minute</span>
            </div>
            <p className="text-3xl font-extrabold font-display">{(o?.minRequests ?? 0).toLocaleString()}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Users */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-neon-lime" />
              Top Users (by requests)
            </h3>
            <div className="space-y-2">
              {data?.topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-xs text-white/20 w-4">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-surface-dark">{u.name?.[0] || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-white/30 truncate">{u.email}</p>
                  </div>
                  <span className={`badge badge-${u.tier}`}>{u.tier}</span>
                  <span className="text-sm font-mono text-neon-cyan">{u.requestCount.toLocaleString()}</span>
                </div>
              ))}
              {(!data?.topUsers || data.topUsers.length === 0) && (
                <p className="text-center text-white/20 py-4">No data yet</p>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-neon-cyan" />
              Recent API Activity
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {data?.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === 200 ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{log.user?.name || "Unknown"}</span>
                      <span className="text-white/20">•</span>
                      <span className="text-xs text-white/30 truncate font-mono">{log.endpoint}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${log.status === 200 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {log.status}
                  </span>
                  <span className="text-xs text-white/20 w-16 text-right">{new Date(log.createdAt).toLocaleTimeString("id-ID")}</span>
                </div>
              ))}
              {(!data?.recentLogs || data.recentLogs.length === 0) && (
                <p className="text-center text-white/20 py-4">No activity yet</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tier & Status Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
            <h3 className="font-display font-semibold mb-3 text-sm">Tier Distribution</h3>
            <div className="space-y-2">
              {data?.tierDistribution.map((t) => {
                const total = data.tierDistribution.reduce((a, b) => a + b._count, 0);
                const pct = total > 0 ? (t._count / total) * 100 : 0;
                const colors: Record<string, string> = { free: "bg-white/20", developer: "bg-blue-400", enterprise: "bg-purple-400", admin: "bg-neon-lime" };
                return (
                  <div key={t.tier}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{t.tier}</span>
                      <span className="text-white/30">{t._count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[t.tier] || "bg-white/20"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="font-display font-semibold mb-3 text-sm">Status Distribution</h3>
            <div className="space-y-2">
              {data?.statusDistribution.map((s) => {
                const total = data.statusDistribution.reduce((a, b) => a + b._count, 0);
                const pct = total > 0 ? (s._count / total) * 100 : 0;
                const colors: Record<string, string> = { active: "bg-green-400", pending: "bg-yellow-400", banned: "bg-red-400" };
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{s.status}</span>
                      <span className="text-white/30">{s._count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[s.status] || "bg-white/20"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color, decimals }: {
  icon: any; label: string; value: number | string; color: string; decimals?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon size={14} className={color} />
        <span className="text-[10px] text-white/20 uppercase">{label}</span>
      </div>
      <p className="text-xl font-extrabold font-display">
        {decimals ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
      </p>
    </motion.div>
  );
}
