"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { User, Key, HelpCircle, Sun, Moon, LogOut, Shield, BarChart3, Settings, FileText, CreditCard } from "lucide-react";
import clsx from "clsx";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  const userItems = [
    { href: "/dashboard", label: "Ringkasan", icon: BarChart3 },
    { href: "/dashboard#keys", label: "Kunci API", icon: Key },
    { href: "/dashboard/plan", label: "Paket Saya", icon: CreditCard },
    { href: "/support", label: "Dukungan", icon: HelpCircle },
  ];

  const adminItems = [
    { href: "/admin", label: "Ringkasan", icon: Shield },
    { href: "/admin/users", label: "Pengguna", icon: User },
    { href: "/admin/keys", label: "Kunci API", icon: Key },
    { href: "/admin/tickets", label: "Tiket", icon: FileText },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ];

  const items = user?.role === "admin" ? adminItems : userItems;

  return (
    <div className="min-h-screen bg-surface-dark pt-16">
      <div className="flex">
        <aside className="hidden lg:block w-64 fixed top-16 bottom-0 border-r border-white/5 bg-surface-dark/80 backdrop-blur-xl overflow-y-auto">
          <div className="p-4">
            <div className="mb-6 p-4 glass-card rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
                  <span className="font-bold text-sm text-surface-dark">{user?.name?.[0] || "U"}</span>
                </div>
                <div>
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-white/30 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={clsx("badge", `badge-${user?.tier}`)}>{user?.tier}</span>
                {user?.role === "admin" && <span className="badge badge-admin">Admin</span>}
              </div>
            </div>

            <nav className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    pathname === item.href
                      ? "text-neon-cyan bg-neon-cyan/10"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-white/5 space-y-1">
              <button
                onClick={toggle}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 w-full transition-all"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
              </button>
              <button
                onClick={() => { logout(); window.location.href = "/"; }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 w-full transition-all"
              >
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
