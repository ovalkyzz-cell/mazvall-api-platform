"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { HelpCircle, Plus, MessageSquare, Clock, Send } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  _count: { replies: number };
  replies?: { id: string; message: string; isAdmin: boolean; createdAt: string; user: { name: string; role: string } }[];
}

const faqs = [
  { q: "How do I get an API key?", a: "Register an account, go to Dashboard, and click 'Generate Key'. Your key will follow the format MVAL-XXXXXXXXXXXX." },
  { q: "What is the rate limit?", a: "Free tier: 10 RPM / 100 RPH / 1000 RPD. Developer: 60 RPM / 2K RPH / 20K RPD. Enterprise: 300 RPM / 10K RPH / 100K RPD." },
  { q: "How do I authenticate API requests?", a: "Include the header 'Authorization: Bearer YOUR_JWT_TOKEN' in your requests. Get a token via /api/auth/login." },
  { q: "Can I upgrade my tier?", a: "Contact support or use the admin panel to change your tier. Tiers affect rate limits and features." },
  { q: "What's the base URL for API calls?", a: "All API calls should be made to https://mazvall-official.my.id" },
];

export default function SupportPage() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (token) {
      fetch("/api/support", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.success) setTickets(d.data.tickets); });
    }
  }, [token]);

  const createTicket = async () => {
    if (!newSubject || !newMessage || !token) return;
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subject: newSubject, message: newMessage, category: newCategory }),
    });
    const d = await res.json();
    if (d.success) {
      setShowNew(false);
      setNewSubject("");
      setNewMessage("");
      const refreshed = await fetch("/api/support", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (refreshed.success) setTickets(refreshed.data.tickets);
    }
  };

  const viewTicket = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/support/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.success) setSelectedTicket(d.data.ticket);
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText || !token) return;
    const res = await fetch(`/api/support/${selectedTicket.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: replyText }),
    });
    const d = await res.json();
    if (d.success) {
      setReplyText("");
      viewTicket(selectedTicket.id);
    }
  };

  const Content = ({ children }: { children: React.ReactNode }) => (
    user ? <DashboardLayout>{children}</DashboardLayout> : <div className="min-h-screen"><Navbar /><div className="pt-24 pb-16 max-w-4xl mx-auto px-4">{children}</div><Footer /></div>
  );

  return (
    <Content>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <HelpCircle size={24} className="text-neon-cyan" /> Support & FAQ
            </h1>
            <p className="text-sm text-white/30 mt-1">Get help or browse frequently asked questions</p>
          </div>
          {user && (
            <button onClick={() => setShowNew(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
              <span className="shine" />
              <Plus size={14} /> New Ticket
            </button>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02]"
                >
                  <span className="text-sm font-medium">{f.q}</span>
                  <span className="text-white/20">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-white/40 border-t border-white/5 pt-3">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* New Ticket Form */}
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="font-display font-semibold mb-4">New Support Ticket</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1">Subject</label>
                  <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm" placeholder="Brief description" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="feature-request">Feature Request</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Message</label>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none" placeholder="Describe your issue..." />
              </div>
              <div className="flex gap-2">
                <button onClick={createTicket} className="btn-primary text-sm py-2 px-4">Submit Ticket</button>
                <button onClick={() => setShowNew(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tickets */}
        {user && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-4">Your Tickets</h2>
            {selectedTicket ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                <button onClick={() => setSelectedTicket(null)} className="text-xs text-neon-cyan mb-4 hover:underline">← Back to tickets</button>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium">{selectedTicket.subject}</h3>
                  <span className={`badge ${selectedTicket.status === "open" ? "badge-open" : "badge-closed"}`}>{selectedTicket.status}</span>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
                  <p className="text-sm text-white/50">{selectedTicket.message}</p>
                  <p className="text-xs text-white/20 mt-2">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                {selectedTicket.replies?.map((r) => (
                  <div key={r.id} className={`rounded-lg p-4 mb-3 ${r.isAdmin ? "bg-neon-cyan/5 border border-neon-cyan/10 ml-6" : "bg-white/[0.02] mr-6"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{r.user.name}</span>
                      {r.isAdmin && <span className="badge badge-admin text-[10px]">Admin</span>}
                      <span className="text-xs text-white/20">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-white/50">{r.message}</p>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <input value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm" placeholder="Type your reply..." onKeyDown={(e) => e.key === "Enter" && sendReply()} />
                  <button onClick={sendReply} className="btn-primary text-sm py-2 px-4 flex items-center gap-1"><Send size={14} /></button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <button onClick={() => viewTicket(t.id)} className="glass-card w-full p-4 text-left hover:bg-white/[0.02] transition-colors flex items-center gap-4">
                      <MessageSquare size={16} className="text-white/20 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{t.subject}</span>
                          <span className={`badge text-[10px] ${t.status === "open" ? "badge-open" : "badge-closed"}`}>{t.status}</span>
                        </div>
                        <p className="text-xs text-white/20 mt-0.5">{t.category} · {t._count.replies} replies</p>
                      </div>
                      <span className="text-xs text-white/20 shrink-0">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </button>
                  </motion.div>
                ))}
                {tickets.length === 0 && (
                  <div className="glass-card p-8 text-center text-white/20 text-sm">No tickets yet. Create one to get help.</div>
                )}
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="glass-card p-8 text-center">
            <p className="text-white/40 mb-4">Sign in to create support tickets and track their status.</p>
            <a href="/auth/login" className="btn-primary text-sm py-2 px-6 inline-block">Sign In</a>
          </div>
        )}
      </div>
    </Content>
  );
}
