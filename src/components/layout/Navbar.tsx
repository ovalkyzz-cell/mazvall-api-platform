"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";
import { Menu, X, Sun, Moon, LogOut, User, Shield, Key, FileText, HelpCircle } from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Documentation" },
    { href: "/support", label: "Support" },
  ];

  const authLinks = user
    ? user.role === "admin"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: User },
          { href: "/admin", label: "Admin Panel", icon: Shield },
        ]
      : [{ href: "/dashboard", label: "Dashboard", icon: User }]
    : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-surface-dark/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
              <span className="font-display font-bold text-sm text-surface-dark">M</span>
            </div>
            <span className="font-display font-bold text-lg">
              <span className="gradient-text">Api&apos;s</span> Mazvall
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  pathname === l.href
                    ? "text-neon-cyan bg-neon-cyan/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {l.label}
              </Link>
            ))}
            {authLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  pathname === l.href || pathname.startsWith(l.href)
                    ? "text-neon-cyan bg-neon-cyan/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <l.icon size={14} />
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/40">{user.name}</span>
                <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-red-400">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                  <span className="shine" />
                  Register
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/50">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-surface-dark/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {[...links, ...authLinks].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/5 flex gap-2">
              <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-ghost text-sm py-2 flex-1 text-center">Login</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className="btn-primary text-sm py-2 flex-1 text-center">Register</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
