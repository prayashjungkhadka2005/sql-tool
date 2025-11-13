"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div className="max-w-7xl mx-auto border border-foreground/10 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-sm rounded-lg">
        <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Brand Section */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity w-fit">
              <div className="w-8 h-8 bg-gradient-to-br from-foreground/10 to-foreground/20 rounded border border-foreground/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="font-bold text-foreground">DevTools</span>
            </Link>
            <p className="text-xs text-foreground/60 font-mono leading-relaxed">
              Free visual tools for backend developers. SQL, MongoDB, GraphQL builders and more.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link 
                  href="/" 
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-foreground/40 group-hover:text-foreground/60">→</span>
                  <span>All Tools</span>
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/prayashjungkhadka2005" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-foreground/40 group-hover:text-foreground/60">→</span>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.upwork.com/freelancers/~016e3cd0e919937c81" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-foreground/40 group-hover:text-foreground/60">→</span>
                  <span>Hire on Upwork</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-4">
              Features
            </h3>
            <ul className="space-y-2.5 text-xs text-foreground/60 font-mono">
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time SQL generation
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Export to CSV, JSON, SQL
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No database required
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                100% free & open-source
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
          <div className="pt-4 border-t border-foreground/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/50 font-mono">
            <p>
              © {new Date().getFullYear()} Built by{" "}
                <span className="text-foreground/70">
                Prayash Jung Khadka
                </span>
            </p>
            <div className="flex items-center gap-4">
              <span>Next.js · TypeScript · Tailwind</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

