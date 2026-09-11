"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  user: { name: string; email: string };
  _count: { replies: number };
}

export default function AdminTicketsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.success) setTickets(d.data.tickets); });
    }
  }, [token]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-yellow-400" />
          <div>
            <h1 className="font-display text-2xl font-bold">Support Tickets</h1>
            <p className="text-sm text-white/30">{tickets.length} total tickets</p>
          </div>
        </div>

        <div className="space-y-3">
          {tickets.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{t.subject}</h3>
                    <span className={`badge ${t.status === "open" ? "badge-open" : t.status === "pending" ? "badge-pending" : "badge-closed"}`}>{t.status}</span>
                    <span className={`badge ${t.priority === "high" ? "badge-closed" : t.priority === "normal" ? "badge-developer" : "badge-free"}`}>{t.priority}</span>
                  </div>
                  <p className="text-xs text-white/30 mb-2 line-clamp-1">{t.message}</p>
                  <div className="flex items-center gap-3 text-xs text-white/20">
                    <span>{t.user.name}</span>
                    <span>{t.user.email}</span>
                    <span>{t._count.replies} replies</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {tickets.length === 0 && (
            <div className="glass-card p-8 text-center text-white/20 text-sm">No tickets yet</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
