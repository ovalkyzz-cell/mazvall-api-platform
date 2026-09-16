"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Tag,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Calendar,
  Percent,
  Hash,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface Discount {
  id: string;
  code: string;
  description: string | null;
  percentage: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
  creator: { name: string; email: string };
  createdAt: string;
}

export default function DiscountsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    percentage: 10,
    maxUses: 100,
    validUntil: "",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, authLoading, router]);

  const fetchDiscounts = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/discounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDiscounts(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "admin") fetchDiscounts();
  }, [token, user]);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Kode diskon berhasil dibuat!");
        setShowModal(false);
        setFormData({ description: "", percentage: 10, maxUses: 100, validUntil: "" });
        fetchDiscounts();
      } else {
        toast.error("Gagal membuat kode diskon");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kode diskon ini?")) return;
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Kode diskon berhasil dihapus!");
        fetchDiscounts();
      }
    } catch {
      toast.error("Gagal menghapus kode diskon");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, active: !active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(active ? "Diskon dinonaktifkan" : "Diskon diaktifkan");
        fetchDiscounts();
      }
    } catch {
      toast.error("Gagal mengubah status diskon");
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Kode diskon disalin!");
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag size={24} className="text-neon-lime" />
            <div>
              <h1 className="font-display text-2xl font-bold">Kode Diskon</h1>
              <p className="text-sm text-white/30">Kelola kode diskon untuk pengguna</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Buat Kode Diskon
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <Tag size={16} className="text-neon-cyan" />
              <span className="text-xs text-white/20">Total Kode</span>
            </div>
            <div className="text-xl font-extrabold font-display">{discounts.length}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <Check size={16} className="text-neon-lime" />
              <span className="text-xs text-white/20">Aktif</span>
            </div>
            <div className="text-xl font-extrabold font-display">{discounts.filter((d) => d.active).length}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <Hash size={16} className="text-neon-magenta" />
              <span className="text-xs text-white/20">Total Digunakan</span>
            </div>
            <div className="text-xl font-extrabold font-display">{discounts.reduce((a, d) => a + d.usedCount, 0)}</div>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Deskripsi</th>
                  <th>Diskon</th>
                  <th>Penggunaan</th>
                  <th>Berlaku Hingga</th>
                  <th>Status</th>
                  <th>Dibuat Oleh</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-neon-cyan font-bold">{discount.code}</code>
                        <button
                          onClick={() => copyCode(discount.code, discount.id)}
                          className="text-white/30 hover:text-neon-cyan transition-colors"
                        >
                          {copiedId === discount.id ? <Check size={14} className="text-neon-lime" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="text-sm text-white/50">{discount.description || "-"}</td>
                    <td>
                      <span className="badge badge-developer flex items-center gap-1 w-fit">
                        <Percent size={12} />
                        {discount.percentage}%
                      </span>
                    </td>
                    <td className="text-sm">
                      <span className="text-white/50">{discount.usedCount}</span>
                      <span className="text-white/20"> / {discount.maxUses}</span>
                    </td>
                    <td className="text-sm text-white/40">
                      {discount.validUntil
                        ? new Date(discount.validUntil).toLocaleDateString("id-ID")
                        : "Selamanya"}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(discount.id, discount.active)}
                        className={`badge cursor-pointer transition-all ${
                          discount.active ? "badge-open" : "badge-closed"
                        }`}
                      >
                        {discount.active ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="text-xs text-white/30">{discount.creator.name}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-white/20 py-8">
                      Belum ada kode diskon
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">Buat Kode Diskon Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Diskon untuk pengguna baru"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1">Persentase Diskon (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: parseInt(e.target.value) || 10 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1">Maks Penggunaan</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 100 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-1">Berlaku Hingga (Opsional)</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Batal
              </button>
              <button onClick={handleCreate} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <RefreshCw size={14} />
                Generate Kode
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
