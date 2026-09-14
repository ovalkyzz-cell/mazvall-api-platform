"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Settings, Save, CheckCircle, Shield, Bot, Gauge, Globe, Ban, Check } from "lucide-react";

interface SecuritySettings {
  botProtection: string;
  rateLimiting: string;
  ddosProtection: string;
  ipBlocklist: string;
  allowlist: string;
  maxRequestsPerSecond: string;
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-neon-cyan" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

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
  const [security, setSecurity] = useState<SecuritySettings>({
    botProtection: "true",
    rateLimiting: "true",
    ddosProtection: "true",
    ipBlocklist: "",
    allowlist: "",
    maxRequestsPerSecond: "10",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            if (d.data.limits) {
              setConfigs(d.data.limits.map((l: any) => ({ tier: l.tier, rpm: l.rpm, rph: l.rph, rpd: l.rpd })));
            }
            if (d.data.security) {
              setSecurity(d.data.security);
            }
          }
        });
    }
  }, [token]);

  const updateConfig = (tier: string, field: string, value: number) => {
    setConfigs((prev) => prev.map((c) => (c.tier === tier ? { ...c, [field]: value } : c)));
  };

  const toggleSecurity = (key: keyof SecuritySettings) => {
    setSecurity((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  };

  const saveConfig = async () => {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ limits: configs, security }),
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
              <h1 className="font-display text-2xl font-bold">Settings</h1>
              <p className="text-sm text-white/30">Configure rate limits & security</p>
            </div>
          </div>
          <button onClick={saveConfig} disabled={saving} className="btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-50">
            <span className="shine" />
            {saving ? "Saving..." : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield size={20} className="text-neon-cyan" />
            <h2 className="font-display font-semibold text-lg">Security & Protection</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Bot size={18} className="text-neon-cyan" />
                <div>
                  <p className="font-medium">Bot Protection</p>
                  <p className="text-xs text-white/40">Block malicious bots & crawlers</p>
                </div>
              </div>
              <Toggle enabled={security.botProtection === "true"} onChange={() => toggleSecurity("botProtection")} label="botProtection" />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Gauge size={18} className="text-neon-cyan" />
                <div>
                  <p className="font-medium">Rate Limiting</p>
                  <p className="text-xs text-white/40">Limit requests per IP address</p>
                </div>
              </div>
              <Toggle enabled={security.rateLimiting === "true"} onChange={() => toggleSecurity("rateLimiting")} label="rateLimiting" />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-neon-cyan" />
                <div>
                  <p className="font-medium">DDoS Protection</p>
                  <p className="text-xs text-white/40">Auto-block flood attacks</p>
                </div>
              </div>
              <Toggle enabled={security.ddosProtection === "true"} onChange={() => toggleSecurity("ddosProtection")} label="ddosProtection" />
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Ban size={18} className="text-red-400" />
                <div>
                  <p className="font-medium">IP Blocklist</p>
                  <p className="text-xs text-white/40">Block specific IPs (comma separated)</p>
                </div>
              </div>
              <input
                type="text"
                value={security.ipBlocklist}
                onChange={(e) => setSecurity((prev) => ({ ...prev, ipBlocklist: e.target.value }))}
                placeholder="192.168.1.1, 10.0.0.1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
              />
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Check size={18} className="text-green-400" />
                <div>
                  <p className="font-medium">IP Allowlist</p>
                  <p className="text-xs text-white/40">Only allow these IPs (comma separated, empty = allow all)</p>
                </div>
              </div>
              <input
                type="text"
                value={security.allowlist}
                onChange={(e) => setSecurity((prev) => ({ ...prev, allowlist: e.target.value }))}
                placeholder="192.168.1.1, 10.0.0.1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Rate Limit Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Gauge size={20} className="text-white/40" />
            <h2 className="font-display font-semibold text-lg">Rate Limits per Tier</h2>
          </div>
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
