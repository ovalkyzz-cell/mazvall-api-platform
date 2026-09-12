"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Settings, Save, CheckCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configs, setConfigs] = useState([
    { tier: "free", rpm: 10, rph: 100, rpd: 1000 },
    { tier: "developer", rpm: 60, rph: 2000, rpd: 20000 },
    { tier: "enterprise", rpm: 300, rph: 10000, rpd: 100000 },
  ]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data.limits) {
            setConfigs(d.data.limits.map((l: any) => ({ tier: l.tier, rpm: l.rpm, rph: l.rph, rpd: l.rpd })));
          }
        });
    }
  }, [token]);

  const updateConfig = (tier: string, field: string, value: number) => {
    setConfigs((prev) => prev.map((c) => (c.tier === tier ? { ...c, [field]: value } : c)));
  };

  const saveConfig = async () => {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ limits: configs }),
    });
    const d = await res.json();
    if (d.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-white/40" />
            <div>
              <h1 className="font-display text-2xl font-bold">Rate Limit Settings</h1>
              <p className="text-sm text-white/30">Configure rate limits per tier</p>
            </div>
          </div>
          <button onClick={saveConfig} disabled={saving} className="btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-50">
            <span className="shine" />
            {saving ? "Saving..." : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>

        <div className="space-y-4">
          {configs.map((c, i) => (
            <motion.div
              key={c.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-display font-semibold text-lg capitalize">{c.tier}</h3>
                <span className={`badge badge-${c.tier}`}>{c.tier}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Requests/Minute</label>
                  <input
                    type="number"
                    value={c.rpm}
                    onChange={(e) => updateConfig(c.tier, "rpm", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Requests/Hour</label>
                  <input
                    type="number"
                    value={c.rph}
                    onChange={(e) => updateConfig(c.tier, "rph", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Requests/Day</label>
                  <input
                    type="number"
                    value={c.rpd}
                    onChange={(e) => updateConfig(c.tier, "rpd", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
