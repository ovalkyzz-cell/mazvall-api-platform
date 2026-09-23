"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeConfig = {
  sm: { container: 32, image: 24, text: "text-sm" },
  md: { container: 40, image: 32, text: "text-lg" },
  lg: { container: 56, image: 44, text: "text-2xl" },
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
      className={`flex items-center gap-2.5 group ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Logo Image with Glow Effect */}
      <div className="relative">
        {/* Animated glow ring */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-cyan via-neon-magenta to-neon-cyan opacity-0 group-hover:opacity-50 blur-md"
          animate={{
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Main logo container */}
        <motion.div
          className="relative rounded-xl overflow-hidden bg-gradient-to-br from-surface-dark/80 to-surface-darker/80 p-1"
          style={{ width: config.container, height: config.container }}
          whileHover={{
            boxShadow: [
              "0 0 20px rgba(0, 255, 255, 0.3)",
              "0 0 40px rgba(255, 0, 255, 0.3)",
              "0 0 20px rgba(0, 255, 255, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Animated border gradient */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #00ffff, #ff00ff, #00ffff)",
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Inner container */}
          <div className="relative w-full h-full rounded-[10px] bg-gradient-to-br from-surface-dark to-surface-darker flex items-center justify-center overflow-hidden">
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 3,
              }}
            />

            <Image
              src="/images/logo.png"
              alt="Mazvall Logo"
              width={config.image}
              height={config.image}
              className="relative z-10 object-contain"
              priority
            />
          </div>
        </motion.div>
      </div>

      {/* Text with gradient */}
      {showText && (
        <motion.span
          className={`font-display font-bold ${config.text} relative`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-magenta bg-clip-text text-transparent">
            Api&apos;s
          </span>
          <span className="text-white ml-1">Mazvall</span>

          {/* Animated underline */}
          <motion.div
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan rounded-full"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.span>
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
