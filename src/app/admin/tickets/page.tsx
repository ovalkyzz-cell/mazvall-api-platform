"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { FileText, Send, ArrowLeft } from "lucide-react";

interface TicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user: { name: string; role: string };
}

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
  replies?: TicketReply[];
}

export default function AdminTicketsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

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

  const viewTicket = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.success) setSelectedTicket(d.data.ticket);
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText || !token || sending) return;
    setSending(true);
    const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: replyText }),
    });
    const d = await res.json();
    if (d.success) {
      setReplyText("");
      viewTicket(selectedTicket.id);
      const refreshed = await fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (refreshed.success) setTickets(refreshed.data.tickets);
    }
    setSending(false);
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    await fetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    viewTicket(id);
    const refreshed = await fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (refreshed.success) setTickets(refreshed.data.tickets);
  };

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

        {selectedTicket ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-sm text-neon-cyan hover:underline">
              <ArrowLeft size={14} /> Back to tickets
            </button>

            <div className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display font-semibold text-lg">{selectedTicket.subject}</h2>
                    <span className={`badge ${selectedTicket.status === "open" ? "badge-open" : selectedTicket.status === "pending" ? "badge-pending" : "badge-closed"}`}>{selectedTicket.status}</span>
                    <span className={`badge ${selectedTicket.priority === "high" ? "badge-closed" : "badge-developer"}`}>{selectedTicket.priority}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span>{selectedTicket.user.name}</span>
                    <span>{selectedTicket.user.email}</span>
                    <span>{selectedTicket.category}</span>
                    <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {["open", "pending", "closed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedTicket.id, s)}
                      className={`badge text-xs cursor-pointer hover:opacity-80 ${selectedTicket.status === s ? "ring-1 ring-white/30" : ""} ${s === "open" ? "badge-open" : s === "pending" ? "badge-pending" : "badge-closed"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
                <p className="text-sm text-white/50 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              <div className="space-y-3 mb-4">
                {selectedTicket.replies?.map((r) => (
                  <div key={r.id} className={`rounded-lg p-4 ${r.isAdmin ? "bg-neon-cyan/5 border border-neon-cyan/10 ml-6" : "bg-white/[0.02] mr-6"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{r.user.name}</span>
                      {r.isAdmin && <span className="badge badge-admin text-[10px]">Admin</span>}
                      <span className="text-xs text-white/20">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-white/50 whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-cyan/50"
                  placeholder="Type your reply as admin..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                />
                <button onClick={sendReply} disabled={sending || !replyText} className="btn-primary text-sm py-2 px-4 flex items-center gap-1 disabled:opacity-50">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button onClick={() => viewTicket(t.id)} className="glass-card w-full p-5 text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{t.subject}</h3>
                        <span className={`badge text-[10px] ${t.status === "open" ? "badge-open" : t.status === "pending" ? "badge-pending" : "badge-closed"}`}>{t.status}</span>
                        <span className={`badge text-[10px] ${t.priority === "high" ? "badge-closed" : "badge-developer"}`}>{t.priority}</span>
                      </div>
                      <p className="text-xs text-white/30 mb-1 line-clamp-1">{t.message}</p>
                      <div className="flex items-center gap-3 text-xs text-white/20">
                        <span>{t.user.name}</span>
                        <span>{t.user.email}</span>
                        <span>{t.category}</span>
                        <span>{t._count.replies} replies</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
            {tickets.length === 0 && (
              <div className="glass-card p-8 text-center text-white/20 text-sm">No tickets yet</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
