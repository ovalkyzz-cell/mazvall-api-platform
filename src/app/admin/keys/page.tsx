"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Key, Plus, Trash2, Power, PowerOff } from "lucide-react";

interface AdminKey {
  id: string;
  key: string;
  name: string;
  active: boolean;
  rateLimit: number;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminKeysPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [showGen, setShowGen] = useState(false);
  const [genUserId, setGenUserId] = useState("");
  const [genName, setGenName] = useState("");
  const [genRate, setGenRate] = useState("100");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      Promise.all([
        fetch("/api/admin/keys", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]).then(([keysData, usersData]) => {
        if (keysData.success) setKeys(keysData.data.keys);
        if (usersData.success) setUsers(usersData.data.users.map((u: any) => ({ id: u.id, name: u.name })));
      });
    }
  }, [token]);

  const generateKey = async () => {
    if (!genUserId || !genName || !token) return;
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: genUserId, name: genName, rateLimit: parseInt(genRate) }),
    });
    const d = await res.json();
    if (d.success) {
      setShowGen(false);
      setGenUserId("");
      setGenName("");
      setGenRate("100");
      const refreshed = await fetch("/api/admin/keys", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (refreshed.success) setKeys(refreshed.data.keys);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key size={24} className="text-neon-magenta" />
            <div>
              <h1 className="font-display text-2xl font-bold">API Key Management</h1>
              <p className="text-sm text-white/30">{keys.length} total keys</p>
            </div>
          </div>
          <button onClick={() => setShowGen(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            <span className="shine" />
            <Plus size={14} /> Generate Key
          </button>
        </div>

        {showGen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4">Generate API Key</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">User</label>
                <select value={genUserId} onChange={(e) => setGenUserId(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">
                  <option value="">Select user</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Key Name</label>
                <input value={genName} onChange={(e) => setGenName(e.target.value)} placeholder="e.g. Production" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Rate Limit (RPM)</label>
                <input value={genRate} onChange={(e) => setGenRate(e.target.value)} type="number" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={generateKey} className="btn-primary text-sm py-2 px-4">Generate</button>
                <button onClick={() => setShowGen(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Name</th>
                <th>User</th>
                <th>Rate Limit</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td><code className="text-xs font-mono text-neon-cyan/70">{k.key}</code></td>
                  <td className="text-sm">{k.name}</td>
                  <td className="text-sm text-white/50">{k.user.name}</td>
                  <td className="text-sm">{k.rateLimit} RPM</td>
                  <td><span className={`badge ${k.active ? "badge-open" : "badge-closed"}`}>{k.active ? "Active" : "Revoked"}</span></td>
                  <td className="text-xs text-white/30">{new Date(k.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
