"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight, Code2, Lock, Key, BarChart3, Shield, Zap } from "lucide-react";

const BASE = "https://api-mazval.zone.id";

const endpoints = [
  {
    method: "POST",
    path: "/api/auth/register",
    title: "Register User",
    desc: "Create a new user account",
    auth: false,
    body: `{ "email": "user@example.com", "password": "secret123", "name": "John" }`,
    response: `{ "success": true, "data": { "user": { "id": "...", "email": "user@example.com", "name": "John", "role": "user", "tier": "free" }, "token": "eyJhbG..." } }`,
  },
  {
    method: "POST",
    path: "/api/auth/login",
    title: "Login",
    desc: "Authenticate and get JWT token",
    auth: false,
    body: `{ "email": "user@example.com", "password": "secret123" }`,
    response: `{ "success": true, "data": { "user": { "id": "...", "email": "user@example.com", "name": "John", "role": "user", "tier": "free" }, "token": "eyJhbG..." } }`,
  },
  {
    method: "GET",
    path: "/api/auth/me",
    title: "Get Current User",
    desc: "Get authenticated user profile",
    auth: true,
    response: `{ "success": true, "data": { "user": { "id": "...", "email": "user@example.com", "name": "John", "role": "user", "tier": "free" } } }`,
  },
  {
    method: "GET",
    path: "/api/keys",
    title: "List API Keys",
    desc: "Get all API keys for the authenticated user",
    auth: true,
    response: `{ "success": true, "data": { "keys": [{ "id": "...", "key": "MVAL-XXXXXXXXXXXX", "name": "Production", "active": true, "rateLimit": 60 }] } }`,
  },
  {
    method: "POST",
    path: "/api/keys",
    title: "Generate API Key",
    desc: "Create a new API key",
    auth: true,
    body: `{ "name": "My App" }`,
    response: `{ "success": true, "data": { "apiKey": { "id": "...", "key": "MVAL-XXXXXXXXXXXX", "name": "My App", "rateLimit": 60 } } }`,
  },
  {
    method: "DELETE",
    path: "/api/keys/:id",
    title: "Delete API Key",
    desc: "Revoke an API key",
    auth: true,
    response: `{ "success": true, "message": "API key deleted" }`,
  },
  {
    method: "PATCH",
    path: "/api/keys/:id",
    title: "Toggle API Key",
    desc: "Enable or disable an API key",
    auth: true,
    body: `{ "active": false }`,
    response: `{ "success": true, "data": { "apiKey": { "active": false } } }`,
  },
  {
    method: "POST",
    path: "/api/validate",
    title: "Validate API Key",
    desc: "Validate an API key and check rate limits",
    auth: false,
    body: `{ "apiKey": "MVAL-XXXXXXXXXXXX", "endpoint": "/api/data", "method": "GET" }`,
    response: `{ "success": true, "data": { "valid": true, "tier": "developer", "rateLimit": 60, "remaining": 55 } }`,
  },
  {
    method: "GET",
    path: "/api/dashboard",
    title: "Dashboard Stats",
    desc: "Get user dashboard statistics and usage logs",
    auth: true,
    response: `{ "success": true, "data": { "logs": [...], "stats": { "todayCount": 42, "weekCount": 312, "monthCount": 1547, "totalKeys": 3 }, "dailyUsage": [...] } }`,
  },
  {
    method: "POST",
    path: "/api/support",
    title: "Create Ticket",
    desc: "Submit a support ticket",
    auth: true,
    body: `{ "subject": "Need help", "message": "I have a question about...", "category": "general", "priority": "normal" }`,
    response: `{ "success": true, "data": { "ticket": { "id": "...", "subject": "Need help", "status": "open" } } }`,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  PATCH: "bg-orange-500/20 text-orange-400",
  DELETE: "bg-red-500/20 text-red-400",
};

export default function DocsPage() {
  const [openEndpoint, setOpenEndpoint] = useState<number | null>(0);
  const [testResults, setTestResults] = useState<Record<number, any>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-medium mb-4">
              <Code2 size={12} /> API Reference
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">API Documentation</h1>
            <p className="text-white/40 max-w-2xl">
              Complete reference for the Api&apos;s Mazvall REST API. Base URL: <code className="text-neon-cyan font-mono text-sm">{BASE}</code>
            </p>
          </motion.div>

          {/* Quick Start */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={18} className="text-neon-lime" /> Quick Start
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/40 mb-2">1. Register an account</p>
                <div className="code-block relative">
                  <button onClick={() => copyText(`curl -X POST ${BASE}/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"secret","name":"You"}'`, "reg")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                    {copied === "reg" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <span className="text-green-400">curl</span> -X <span className="text-yellow-400">POST</span> <span className="text-neon-cyan">{BASE}/api/auth/register</span> {"\\"}<br/>
                  &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Content-Type: application/json&quot;</span> {"\\"}<br/>
                  &nbsp;&nbsp;-d <span className="text-orange-300">&apos;{`{"email":"you@example.com","password":"secret","name":"You"}`}&apos;</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/40 mb-2">2. Generate an API key</p>
                <div className="code-block relative">
                  <button onClick={() => copyText(`curl -X POST ${BASE}/api/keys \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My App"}'`, "gen")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                    {copied === "gen" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <span className="text-green-400">curl</span> -X <span className="text-yellow-400">POST</span> <span className="text-neon-cyan">{BASE}/api/keys</span> {"\\"}<br/>
                  &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Authorization: Bearer YOUR_TOKEN&quot;</span> {"\\"}<br/>
                  &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Content-Type: application/json&quot;</span> {"\\"}<br/>
                  &nbsp;&nbsp;-d <span className="text-orange-300">&apos;{`{"name":"My App"}`}&apos;</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/40 mb-2">3. Validate your key</p>
                <div className="code-block relative">
                  <button onClick={() => copyText(`curl -X POST ${BASE}/api/validate \\
  -H "Content-Type: application/json" \\
  -d '{"apiKey":"MVAL-XXXXXXXXXXXX"}'`, "val")} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
                    {copied === "val" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <span className="text-green-400">curl</span> -X <span className="text-yellow-400">POST</span> <span className="text-neon-cyan">{BASE}/api/validate</span> {"\\"}<br/>
                  &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Content-Type: application/json&quot;</span> {"\\"}<br/>
                  &nbsp;&nbsp;-d <span className="text-orange-300">&apos;{`{"apiKey":"MVAL-XXXXXXXXXXXX"}`}&apos;</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Auth Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Lock size={18} className="text-neon-magenta" /> Authentication
            </h2>
            <p className="text-sm text-white/40 mb-4">
              All protected endpoints require a Bearer token in the Authorization header. Obtain a token via <code className="text-neon-cyan font-mono">/api/auth/login</code> or <code className="text-neon-cyan font-mono">/api/auth/register</code>.
            </p>
            <div className="code-block">
              <span className="text-green-400">curl</span> <span className="text-neon-cyan">{BASE}/api/keys</span> {"\\"}<br/>
              &nbsp;&nbsp;-H <span className="text-orange-300">&quot;Authorization: Bearer eyJhbGciOiJIUzI1NiIs...&quot;</span>
            </div>
          </motion.div>

          {/* Rate Limits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-neon-cyan" /> Rate Limits
            </h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Tier</th><th>Requests/Minute</th><th>Requests/Hour</th><th>Requests/Day</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge badge-free">Free</span></td>
                    <td className="text-sm">10</td>
                    <td className="text-sm">100</td>
                    <td className="text-sm">1,000</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-developer">Developer</span></td>
                    <td className="text-sm">60</td>
                    <td className="text-sm">2,000</td>
                    <td className="text-sm">20,000</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-enterprise">Enterprise</span></td>
                    <td className="text-sm">300</td>
                    <td className="text-sm">10,000</td>
                    <td className="text-sm">100,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Endpoints */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
            <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Key size={20} className="text-neon-lime" /> Endpoints
            </h2>

            <div className="space-y-3">
              {endpoints.map((ep, i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setOpenEndpoint(openEndpoint === i ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className={`badge text-xs font-mono ${methodColors[ep.method]}`}>{ep.method}</span>
                    <code className="text-sm font-mono text-white/60 flex-1">{ep.path}</code>
                    <span className="text-sm text-white/40 hidden sm:block">{ep.title}</span>
                    {ep.auth && <Lock size={12} className="text-neon-magenta" />}
                    {openEndpoint === i ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />}
                  </button>

                  {openEndpoint === i && (
                    <div className="border-t border-white/5 p-4 space-y-4">
                      <p className="text-sm text-white/40">{ep.desc}</p>
                      {ep.auth && (
                        <div className="flex items-center gap-2 text-xs text-neon-magenta/70">
                          <Lock size={10} /> Requires Bearer token
                        </div>
                      )}
                      {ep.body && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/30 uppercase tracking-wider">Request Body</span>
                            <button onClick={() => copyText(ep.body!, `body-${i}`)} className="text-white/20 hover:text-white/50">
                              {copied === `body-${i}` ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                          <pre className="code-block text-xs">{ep.body}</pre>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/30 uppercase tracking-wider">Response</span>
                          <button onClick={() => copyText(ep.response, `res-${i}`)} className="text-white/20 hover:text-white/50">
                            {copied === `res-${i}` ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <pre className="code-block text-xs">{ep.response}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* API Key Format */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Shield size={18} className="text-yellow-400" /> API Key Format
            </h2>
            <p className="text-sm text-white/40 mb-4">
              All API keys follow the format <code className="text-neon-cyan font-mono font-bold">MVAL-XXXXXXXXXXXX</code> where X is a 12-character alphanumeric string.
            </p>
            <div className="code-block text-center text-lg font-mono text-neon-cyan tracking-wider">
              MVAL-A3B7K9M2X4P8
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
