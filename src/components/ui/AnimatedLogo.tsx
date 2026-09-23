"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeConfig = {
  xs: { container: 28, image: 18, text: "text-xs", ring: 32 },
  sm: { container: 36, image: 24, text: "text-sm", ring: 42 },
  md: { container: 44, image: 30, text: "text-base", ring: 52 },
  lg: { container: 56, image: 40, text: "text-lg", ring: 66 },
  xl: { container: 72, image: 52, text: "text-xl", ring: 84 },
};

export default function AnimatedLogo({
  size = "md",
  showText = true,
  href = "/",
  className = "",
}: AnimatedLogoProps) {
  const config = sizeConfig[size];

  const logoContent = (
    <motion.div
      className={`flex items-center gap-3 group ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Logo Circle Container */}
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        {/* Outer animated ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, #00ffff, #ff00ff, #00ffff)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 blur-md"
          style={{
            background: "conic-gradient(from 0deg, #00ffff, #ff00ff, #00ffff)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* White ring border */}
        <div
          className="absolute rounded-full bg-surface-dark"
          style={{
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
          }}
        />

        {/* Inner container with image */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-surface-dark to-surface-darker flex items-center justify-center overflow-hidden border border-white/10"
          style={{
            top: 3,
            left: 3,
            right: 3,
            bottom: 3,
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
          />

          {/* Pulse glow on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 opacity-0 group-hover:opacity-100 rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0, 0.3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <Image
            src="/images/logo.png"
            alt="Mazvall Logo"
            width={config.image}
            height={config.image}
            className="relative z-10 object-contain rounded-full"
            priority
          />
        </div>
      </div>

      {/* Text with gradient */}
      {showText && (
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className={`font-display font-bold ${config.text} leading-tight`}>
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-magenta bg-clip-text text-transparent">
              Api&apos;s
            </span>
            <span className="text-white ml-1.5">Mazvall</span>
          </span>
          {size !== "xs" && size !== "sm" && (
            <span className="text-[10px] text-white/30 tracking-widest uppercase">
              REST API Platform
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
