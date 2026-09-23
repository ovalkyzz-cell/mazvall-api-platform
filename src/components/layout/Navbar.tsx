"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, LogOut, User, Shield } from "lucide-react";
import clsx from "clsx";
import AnimatedLogo from "@/components/ui/AnimatedLogo";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-2xl bg-surface-dark/80 border-b border-white/10 shadow-lg shadow-black/20"
          : "backdrop-blur-xl bg-surface-dark/60 border-b border-white/5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <AnimatedLogo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Link
                  href={l.href}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all relative group",
                    pathname === l.href
                      ? "text-neon-cyan"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  {l.label}
                  {pathname === l.href && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              </motion.div>
            ))}
            {authLinks.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (links.length + i) }}
              >
                <Link
                  href={l.href}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative",
                    pathname === l.href || pathname.startsWith(l.href)
                      ? "text-neon-cyan"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  <l.icon size={14} />
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {user ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm text-white/40">{user.name}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-red-400"
                >
                  <LogOut size={18} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4 relative overflow-hidden group">
                  <span className="shine" />
                  <span className="relative z-10">Register</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-white/50 hover:text-white"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/5 bg-surface-dark/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {[...links, ...authLinks].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "block px-4 py-3 rounded-lg text-sm transition-all",
                      pathname === l.href
                        ? "text-neon-cyan bg-neon-cyan/10"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-2 border-t border-white/5 flex gap-2"
              >
                <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-ghost text-sm py-2 flex-1 text-center">
                  Login
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className="btn-primary text-sm py-2 flex-1 text-center">
                  Register
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
