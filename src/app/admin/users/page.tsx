"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Users, Trash2, Edit, ChevronDown, CheckCircle, XCircle, Ban, ShieldCheck } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  status?: string;
  createdAt: string;
  _count: { apiKeys: number; usageLogs: number };
}

export default function AdminUsersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setUsers(d.data.users);
        });
    }
  }, [token]);

  const filteredUsers = users.filter((u) => {
    if (statusFilter === "all") return true;
    return u.status === statusFilter;
  });

  const updateTier = async (id: string, tier: string) => {
    if (!token) return;
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tier }),
    });
    setEditingTier(null);
    const d = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (d.success) setUsers(d.data.users);
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const d = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (d.success) setUsers(d.data.users);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Hapus pengguna ini?") || !token) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/15 text-green-400 border border-green-500/20">Aktif</span>;
      case "pending":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">Menunggu</span>;
      case "banned":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/15 text-red-400 border border-red-500/20">Diblokir</span>;
      case "rejected":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">Ditolak</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/50">{status || "Tidak Diketahui"}</span>;
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-neon-cyan" />
            <div>
              <h1 className="font-display text-2xl font-bold">Manajemen Pengguna</h1>
              <p className="text-sm text-white/30">{users.length} pengguna terdaftar</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors"
            >
              Status: {statusFilter === "all" ? "Semua" : statusFilter === "active" ? "Aktif" : statusFilter === "pending" ? "Menunggu" : statusFilter === "banned" ? "Diblokir" : statusFilter}
              <ChevronDown size={14} />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#0a0a1a] border border-white/10 shadow-xl z-50">
                {[
                  { value: "all", label: "Semua" },
                  { value: "active", label: "Aktif" },
                  { value: "pending", label: "Menunggu" },
                  { value: "banned", label: "Diblokir" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setShowFilter(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === opt.value ? "text-neon-cyan" : "text-white/70"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Kunci API</th>
                <th>Log Penggunaan</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div>
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-white/30">{u.email}</div>
                    </div>
                  </td>
                  <td><span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-developer"}`}>{u.role}</span></td>
                  <td>
                    {editingTier === u.id ? (
                      <div className="flex items-center gap-1">
                        {["free", "developer", "enterprise"].map((t) => (
                          <button
                            key={t}
                            onClick={() => updateTier(u.id, t)}
                            className={`badge cursor-pointer hover:opacity-80 ${u.tier === t ? "ring-1 ring-white/30" : ""} badge-${t}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => setEditingTier(u.id)} className="flex items-center gap-1 cursor-pointer group">
                        <span className={`badge badge-${u.tier}`}>{u.tier}</span>
                        <Edit size={10} className="text-white/0 group-hover:text-white/40" />
                      </button>
                    )}
                  </td>
                  <td>{statusBadge(u.status)}</td>
                  <td className="text-sm">{u._count.apiKeys}</td>
                  <td className="text-sm">{u._count.usageLogs.toLocaleString()}</td>
                  <td className="text-xs text-white/30">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {u.status === "pending" && u.role !== "admin" && (
                        <>
                          <button
                            onClick={() => updateStatus(u.id, "active")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-medium transition-colors"
                          >
                            <CheckCircle size={14} />
                            Setujui
                          </button>
                          <button
                            onClick={() => updateStatus(u.id, "rejected")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 text-xs font-medium transition-colors"
                          >
                            <XCircle size={14} />
                            Tolak
                          </button>
                        </>
                      )}
                      {u.status === "active" && u.role !== "admin" && (
                        <button
                          onClick={() => updateStatus(u.id, "banned")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors"
                        >
                          <Ban size={14} />
                          Blokir
                        </button>
                      )}
                      {u.status === "banned" && u.role !== "admin" && (
                        <button
                          onClick={() => updateStatus(u.id, "active")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-medium transition-colors"
                        >
                          <ShieldCheck size={14} />
                          Buka Blokir
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors"
                        >
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-white/30 text-sm">Tidak ada pengguna ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
