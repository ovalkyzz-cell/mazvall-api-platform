"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/ui/AnimatedLogo";

export default function Footer() {
  const footerLinks = {
    platform: [
      { href: "/docs", label: "Documentation" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/support", label: "Support" },
      { href: "/pricing", label: "Pricing" },
    ],
    api: [
      { href: "/docs", label: "API Reference" },
      { href: "/docs", label: "Endpoints" },
      { href: "/playground", label: "Playground" },
    ],
    legal: [
      { href: "#", label: "Terms of Service" },
      { href: "#", label: "Privacy Policy" },
      { href: "#", label: "API License" },
    ],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="relative z-10 border-t border-white/5 bg-surface-dark/80 backdrop-blur-xl overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
            x: [0, 100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-neon-magenta/5 to-transparent rounded-full blur-3xl"
          animate={{
            rotate: [360, 0],
            x: [0, -100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="md:col-span-1">
            <div className="mb-4">
              <AnimatedLogo size="md" />
            </div>
            <p className="text-sm text-white/30 leading-relaxed mt-4">
              Professional REST API platform with interactive documentation, rate limiting, and developer tools.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {["github", "twitter", "discord"].map((social) => (
                <motion.a
                  key={social}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                >
                  <span className="text-xs font-medium uppercase">{social[0]}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Platform Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/40 mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/30 hover:text-neon-cyan transition-colors inline-block hover:translate-x-1 transform"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* API Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/40 mb-4">
              API
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-white/30">Base URL:</span>
              </li>
              <li>
                <code className="text-xs text-neon-cyan font-mono bg-neon-cyan/5 px-2 py-1 rounded">
                  https://api-mazval.zone.id
                </code>
              </li>
              {footerLinks.api.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/30 hover:text-neon-cyan transition-colors inline-block hover:translate-x-1 transform"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/40 mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/30 hover:text-neon-cyan transition-colors inline-block hover:translate-x-1 transform"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Created{" "}
            <span className="text-white/40 font-semibold">Mazz-Vall Developer</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/15">Built with Next.js + Prisma</span>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <span className="text-xs text-white/15">All Systems Operational</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
