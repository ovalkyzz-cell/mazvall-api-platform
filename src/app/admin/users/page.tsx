"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Users, Trash2, Edit, ChevronDown } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  createdAt: string;
  _count: { apiKeys: number; usageLogs: number };
}

export default function AdminUsersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editingTier, setEditingTier] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.success) setUsers(d.data.users); });
    }
  }, [token]);

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

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?") || !token) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-neon-cyan" />
          <div>
            <h1 className="font-display text-2xl font-bold">User Management</h1>
            <p className="text-sm text-white/30">{users.length} registered users</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Tier</th>
                <th>API Keys</th>
                <th>Requests</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
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
                  <td className="text-sm">{u._count.apiKeys}</td>
                  <td className="text-sm">{u._count.usageLogs.toLocaleString()}</td>
                  <td className="text-xs text-white/30">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.role !== "admin" && (
                      <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
