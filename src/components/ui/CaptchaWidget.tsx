"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
}

export default function CaptchaWidget({ onVerify }: CaptchaWidgetProps) {
  const [state, setState] = useState<"idle" | "loading" | "verified">("idle");
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/security")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setEnabled(d.data.botProtection === "true");
          if (d.data.botProtection !== "true") {
            onVerify("bypass-" + Date.now());
          }
        }
      })
      .catch(() => {});

    const generateToken = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    setToken(generateToken());
  }, []);

  const handleCheck = () => {
    if (state !== "idle") return;
    setState("loading");
    setTimeout(() => {
      const newToken = token + "-" + Date.now();
      setState("verified");
      onVerify(newToken);
    }, 1200);
  };

  if (!enabled) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.button
                key="idle"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleCheck}
                className="w-7 h-7 rounded-lg border-2 border-white/20 bg-white/5 flex items-center justify-center hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all cursor-pointer"
              >
                <Shield size={14} className="text-white/30" />
              </motion.button>
            )}
            {state === "loading" && (
              <motion.div
                key="loading"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-7 h-7 rounded-lg border-2 border-neon-cyan/50 bg-neon-cyan/10 flex items-center justify-center"
              >
                <Loader2 size={14} className="text-neon-cyan animate-spin" />
              </motion.div>
            )}
            {state === "verified" && (
              <motion.div
                key="verified"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-7 h-7 rounded-lg border-2 border-green-500/50 bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle size={14} className="text-green-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <p className="text-sm font-medium text-white/70">
            {state === "verified" ? "Verified!" : "I'm not a robot"}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center border border-white/10">
          <Shield size={18} className="text-neon-cyan" />
        </div>
        <span className="text-[9px] text-white/30 font-medium">Mazvall</span>
      </div>
    </div>
  );
}
