"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Zap,
  Calendar,
  Hash,
  Percent,
  DollarSign,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  planId: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  plan: { name: string; slug: string; price: number };
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
}

export default function AdminCouponsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterPlan, setFilterPlan] = useState("all");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    planId: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "1",
    expiresAt: "",
  });

  const [batchForm, setBatchForm] = useState({
    planId: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "1",
    expiresAt: "",
    count: "5",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  const fetchCoupons = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/admin/coupons", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setCoupons(data.data);
    setLoading(false);
  };

  const fetchPlans = async () => {
    if (!token) return;
    const res = await fetch("/api/plans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setPlans(data.data);
  };

  useEffect(() => {
    if (token) {
      fetchCoupons();
      fetchPlans();
    }
  }, [token]);

  const handleCreate = async () => {
    if (!token || !form.planId || !form.discountValue) return;
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setForm({ planId: "", discountType: "percentage", discountValue: "", maxUses: "1", expiresAt: "" });
      fetchCoupons();
    }
  };

  const handleBatchGenerate = async () => {
    if (!token || !batchForm.planId || !batchForm.discountValue || !batchForm.count) return;
    const res = await fetch("/api/admin/coupons/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(batchForm),
    });
    const data = await res.json();
    if (data.success) {
      setShowBatchModal(false);
      setBatchForm({ planId: "", discountType: "percentage", discountValue: "", maxUses: "1", expiresAt: "", count: "5" });
      fetchCoupons();
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    if (!token) return;
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: !active }),
    });
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Yakin ingin menghapus coupon ini?")) return;
    await fetch(`/api/admin/coupons/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCoupons();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = coupons.filter((c) => {
    if (filterPlan !== "all" && c.planId !== filterPlan) return false;
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.active).length,
    used: coupons.reduce((sum, c) => sum + c.usedCount, 0),
  };

  if (authLoading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ticket size={24} className="text-white/40" />
            <div>
              <h1 className="font-display text-2xl font-bold">Kode Diskon</h1>
              <p className="text-sm text-white/30">Generate & manage kode diskon per paket</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              <Zap size={14} /> Batch Generate
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              <Plus size={14} /> Tambah Coupon
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Coupon", value: stats.total, icon: Hash, color: "text-neon-cyan" },
            { label: "Active", value: stats.active, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Digunakan", value: stats.used, icon: DollarSign, color: "text-yellow-400" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-xs text-white/40">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Cari kode diskon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
          >
            <option value="all">Semua Paket</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button onClick={fetchCoupons} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-white/30">
              <Ticket size={40} className="mx-auto mb-3 opacity-50" />
              <p>Belum ada kode diskon</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/40 font-medium">Kode</th>
                    <th className="text-left p-4 text-white/40 font-medium">Paket</th>
                    <th className="text-left p-4 text-white/40 font-medium">Diskon</th>
                    <th className="text-left p-4 text-white/40 font-medium">Penggunaan</th>
                    <th className="text-left p-4 text-white/40 font-medium">Status</th>
                    <th className="text-left p-4 text-white/40 font-medium">Kadaluarsa</th>
                    <th className="text-right p-4 text-white/40 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((coupon, i) => (
                    <motion.tr
                      key={coupon.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-neon-cyan text-xs bg-neon-cyan/10 px-2 py-1 rounded">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.code, coupon.id)}
                            className="text-white/30 hover:text-white transition-colors"
                          >
                            {copiedId === coupon.id ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="badge">{coupon.plan.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {coupon.discountType === "percentage" ? <Percent size={12} /> : <DollarSign size={12} />}
                          <span>
                            {coupon.discountValue}
                            {coupon.discountType === "percentage" ? "%" : " IDR"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white/60">
                          {coupon.usedCount}/{coupon.maxUses}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggle(coupon.id, coupon.active)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            coupon.active ? "bg-green-500" : "bg-white/20"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              coupon.active ? "translate-x-4.5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-white/40 text-xs">
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString("id-ID")
                            : "Tidak ada"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Single Coupon Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Tambah Coupon</h2>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Paket</label>
                  <select
                    value={form.planId}
                    onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                  >
                    <option value="">Pilih paket</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Rp {p.price.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Tipe Diskon</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    >
                      <option value="percentage">Persen (%)</option>
                      <option value="fixed">Nominal (IDR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Nilai Diskon</label>
                    <input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      placeholder={form.discountType === "percentage" ? "10" : "5000"}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Maks. Penggunaan</label>
                    <input
                      type="number"
                      value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                      placeholder="1"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Kadaluarsa</label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>

                <button onClick={handleCreate} className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
                  <Plus size={14} /> Generate Kode Diskon
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Batch Generate Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Batch Generate Coupon</h2>
                <button onClick={() => setShowBatchModal(false)} className="text-white/40 hover:text-white">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Paket</label>
                  <select
                    value={batchForm.planId}
                    onChange={(e) => setBatchForm({ ...batchForm, planId: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                  >
                    <option value="">Pilih paket</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Rp {p.price.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Tipe Diskon</label>
                    <select
                      value={batchForm.discountType}
                      onChange={(e) => setBatchForm({ ...batchForm, discountType: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    >
                      <option value="percentage">Persen (%)</option>
                      <option value="fixed">Nominal (IDR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Nilai Diskon</label>
                    <input
                      type="number"
                      value={batchForm.discountValue}
                      onChange={(e) => setBatchForm({ ...batchForm, discountValue: e.target.value })}
                      placeholder={batchForm.discountType === "percentage" ? "10" : "5000"}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Jumlah</label>
                    <input
                      type="number"
                      value={batchForm.count}
                      onChange={(e) => setBatchForm({ ...batchForm, count: e.target.value })}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Maks. Pemakaian</label>
                    <input
                      type="number"
                      value={batchForm.maxUses}
                      onChange={(e) => setBatchForm({ ...batchForm, maxUses: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Kadaluarsa</label>
                    <input
                      type="date"
                      value={batchForm.expiresAt}
                      onChange={(e) => setBatchForm({ ...batchForm, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>

                <button onClick={handleBatchGenerate} className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
                  <Zap size={14} /> Generate {batchForm.count || "0"} Kode Diskon
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
