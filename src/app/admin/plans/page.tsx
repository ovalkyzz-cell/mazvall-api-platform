"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Package,
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
  Clock,
  ToggleLeft,
  ToggleRight,
  Save,
  Edit,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  requestsPerDay: number;
  requestsPerMin: number;
  requestsPerHour: number;
  description: string;
  features: string;
  featureAccess: string;
  popular: boolean;
  active: boolean;
  discountCode: string | null;
  discountType: string | null;
  discountValue: number | null;
  discountMaxUses: number | null;
  discountUsedCount: number;
  discountExpiresAt: string | null;
}

export default function AdminPlansPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: "",
    requestsPerDay: "100",
    requestsPerMin: "10",
    requestsPerHour: "500",
    description: "",
    features: "",
    featureAccess: "all",
    popular: false,
    discountCode: "",
    discountType: "percentage",
    discountValue: "",
    discountMaxUses: "",
    discountExpiresDate: "",
    discountExpiresTime: "23:59",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  const fetchPlans = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/admin/plans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setPlans(data.data);
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchPlans();
  }, [token]);

  const generateDiscountCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, discountCode: `DISCON-MVAL-${code}` });
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: "",
      slug: "",
      price: "",
      requestsPerDay: "100",
      requestsPerMin: "10",
      requestsPerHour: "500",
      description: "",
      features: "",
      featureAccess: "all",
      popular: false,
      discountCode: "",
      discountType: "percentage",
      discountValue: "",
      discountMaxUses: "",
      discountExpiresDate: "",
      discountExpiresTime: "23:59",
    });
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    let expiresDate = "";
    let expiresTime = "23:59";
    if (plan.discountExpiresAt) {
      const d = new Date(plan.discountExpiresAt);
      expiresDate = d.toISOString().split("T")[0];
      expiresTime = d.toTimeString().slice(0, 5);
    }
    setForm({
      name: plan.name,
      slug: plan.slug,
      price: plan.price.toString(),
      requestsPerDay: plan.requestsPerDay.toString(),
      requestsPerMin: plan.requestsPerMin.toString(),
      requestsPerHour: plan.requestsPerHour.toString(),
      description: plan.description,
      features: plan.features,
      featureAccess: plan.featureAccess,
      popular: plan.popular,
      discountCode: plan.discountCode || "",
      discountType: plan.discountType || "percentage",
      discountValue: plan.discountValue?.toString() || "",
      discountMaxUses: plan.discountMaxUses?.toString() || "",
      discountExpiresDate: expiresDate,
      discountExpiresTime: expiresTime,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!token || !form.name || !form.slug || !form.price) return;

    let discountExpiresAt = null;
    if (form.discountExpiresDate) {
      discountExpiresAt = `${form.discountExpiresDate}T${form.discountExpiresTime}:00`;
    }

    const payload = {
      ...(editingPlan ? { id: editingPlan.id } : {}),
      name: form.name,
      slug: form.slug,
      price: form.price,
      requestsPerDay: form.requestsPerDay,
      requestsPerMin: form.requestsPerMin,
      requestsPerHour: form.requestsPerHour,
      description: form.description,
      features: form.features,
      featureAccess: form.featureAccess,
      popular: form.popular,
      discountCode: form.discountCode || null,
      discountType: form.discountType,
      discountValue: form.discountValue || null,
      discountMaxUses: form.discountMaxUses || null,
      discountExpiresAt,
    };

    const method = editingPlan ? "PUT" : "POST";
    const res = await fetch("/api/admin/plans", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      fetchPlans();
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    if (!token) return;
    await fetch("/api/admin/plans", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: plan.id, active: !plan.active }),
    });
    fetchPlans();
  };

  const handleTogglePopular = async (plan: Plan) => {
    if (!token) return;
    await fetch("/api/admin/plans", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: plan.id, popular: !plan.popular }),
    });
    fetchPlans();
  };

  const filtered = plans.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <Package size={24} className="text-white/40" />
            <div>
              <h1 className="font-display text-2xl font-bold">Manajemen Paket</h1>
              <p className="text-sm text-white/30">Kelola paket & kode diskon per paket</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={14} /> Tambah Paket
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Cari paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
          <button onClick={fetchPlans} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/30">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p>Belum ada paket</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 relative"
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-neon-cyan/20 text-neon-cyan text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Zap size={10} /> Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold text-neon-cyan mt-1">
                    Rp {plan.price.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-white/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Hash size={12} />
                    <span>{plan.requestsPerDay} req/hari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>{plan.requestsPerMin} req/menit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>{plan.requestsPerHour} req/jam</span>
                  </div>
                </div>

                {/* Discount Info */}
                {plan.discountCode && (
                  <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent size={12} className="text-green-400" />
                      <span className="text-xs text-white/40">Kode Diskon Aktif</span>
                    </div>
                    <code className="font-mono text-neon-cyan text-sm bg-neon-cyan/10 px-2 py-1 rounded block mb-2">
                      {plan.discountCode}
                    </code>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span>
                        {plan.discountType === "percentage" ? `${plan.discountValue}%` : `Rp ${plan.discountValue?.toLocaleString("id-ID")}`}
                      </span>
                      <span>
                        {plan.discountUsedCount}/{plan.discountMaxUses || "∞"} digunakan
                      </span>
                    </div>
                    {plan.discountExpiresAt && (
                      <p className="text-xs text-yellow-400/70 mt-1">
                        Expired: {new Date(plan.discountExpiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex-1 btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`p-2 rounded-lg transition-colors ${
                      plan.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                    }`}
                  >
                    {plan.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => handleTogglePopular(plan)}
                    className={`p-2 rounded-lg transition-colors ${
                      plan.popular ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/10 text-white/40"
                    }`}
                  >
                    <Zap size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 w-full max-w-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">
                  {editingPlan ? "Edit Paket" : "Tambah Paket Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 mb-3">Informasi Dasar</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Nama Paket</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Premium"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Slug</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="premium"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-white/40 mb-1">Harga (IDR)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="50000"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-white/40 mb-1">Deskripsi</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi paket..."
                      rows={2}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50 resize-none"
                    />
                  </div>
                </div>

                {/* Rate Limits */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 mb-3">Rate Limits</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Per Menit</label>
                      <input
                        type="number"
                        value={form.requestsPerMin}
                        onChange={(e) => setForm({ ...form, requestsPerMin: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Per Jam</label>
                      <input
                        type="number"
                        value={form.requestsPerHour}
                        onChange={(e) => setForm({ ...form, requestsPerHour: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Per Hari</label>
                      <input
                        type="number"
                        value={form.requestsPerDay}
                        onChange={(e) => setForm({ ...form, requestsPerDay: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 mb-3">Pengaturan Diskon</h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Kode Diskon</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.discountCode}
                          onChange={(e) => setForm({ ...form, discountCode: e.target.value })}
                          placeholder="DISCON-MVAL-XXXXX"
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:outline-none focus:border-neon-cyan/50"
                        />
                        <button
                          type="button"
                          onClick={generateDiscountCode}
                          className="px-3 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg text-sm hover:bg-neon-cyan/30 transition-colors flex items-center gap-1"
                        >
                          <Zap size={12} /> Generate
                        </button>
                      </div>
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
                          value={form.discountMaxUses}
                          onChange={(e) => setForm({ ...form, discountMaxUses: e.target.value })}
                          placeholder="100"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                        />
                        <p className="text-xs text-white/30 mt-1">Kosongkan untuk unlimited</p>
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Tanggal Kadaluarsa</label>
                        <input
                          type="date"
                          value={form.discountExpiresDate}
                          onChange={(e) => setForm({ ...form, discountExpiresDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                        />
                      </div>
                    </div>

                    {form.discountExpiresDate && (
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Waktu Kadaluarsa</label>
                        <input
                          type="time"
                          value={form.discountExpiresTime}
                          onChange={(e) => setForm({ ...form, discountExpiresTime: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.popular}
                      onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                      className="w-4 h-4 rounded bg-white/5 border-white/10 text-neon-cyan focus:ring-neon-cyan/50"
                    />
                    <span className="text-sm text-white/60">Tandai sebagai Popular</span>
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2"
                >
                  <Save size={14} /> {editingPlan ? "Simpan Perubahan" : "Buat Paket"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
