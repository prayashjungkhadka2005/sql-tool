"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-foreground/5 border border-foreground/10 rounded-full font-mono text-xs">
            <svg className="w-3.5 h-3.5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="text-foreground/70 uppercase tracking-wider">Developer Tools</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
            SQL & Database Tools
          </h1>
          
          <p className="text-base sm:text-lg text-foreground/60 max-w-3xl mx-auto mb-8 leading-relaxed">
            Free visual tools for backend developers. Build queries, learn SQL, and work faster.
            <br className="hidden sm:block" />
            No signup required. No database needed. Just tools that work.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-foreground/70">100% Free</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-foreground/70">No Sign-up</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-foreground/70">Open Source</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

