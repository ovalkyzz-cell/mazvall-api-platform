import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-surface-dark/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
                <span className="font-display font-bold text-sm text-surface-dark">M</span>
              </div>
              <span className="font-display font-bold text-lg">
                <span className="gradient-text">Api&apos;s</span> Mazvall
              </span>
            </Link>
            <p className="text-sm text-white/30 leading-relaxed">
              Professional REST API platform with interactive documentation, rate limiting, and developer tools.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/40 mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/docs" className="text-sm text-white/30 hover:text-neon-cyan transition-colors">Documentation</Link></li>
              <li><Link href="/dashboard" className="text-sm text-white/30 hover:text-neon-cyan transition-colors">Dashboard</Link></li>
              <li><Link href="/support" className="text-sm text-white/30 hover:text-neon-cyan transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/40 mb-4">API</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-white/30">Base URL:</span></li>
              <li><code className="text-xs text-neon-cyan font-mono">https://api-mazval.zone.id</code></li>
              <li><Link href="/docs" className="text-sm text-white/30 hover:text-neon-cyan transition-colors">API Reference</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/40 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-white/30">Terms of Service</span></li>
              <li><span className="text-sm text-white/30">Privacy Policy</span></li>
              <li><span className="text-sm text-white/30">API License</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/20">
            &copy; Created <span className="text-white/40 font-semibold">Mazz-Vall Developer</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/15">Built with Next.js + Prisma</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/15">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
