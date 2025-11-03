"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  available?: boolean;
}

export default function ToolCard({
  title,
  description,
  icon,
  href,
  badge,
  available = true,
}: ToolCardProps) {
  const content = (
    <motion.div
      whileHover={available ? { scale: 1.02, y: -4 } : {}}
      className={`relative h-full min-h-[280px] p-6 sm:p-8 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg transition-all flex flex-col ${
        available 
          ? "hover:border-foreground/30 hover:shadow-xl cursor-pointer" 
          : "opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 px-2 py-0.5 bg-foreground/10 border border-foreground/20 text-foreground/60 text-[10px] font-mono rounded uppercase">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-foreground/5 border border-foreground/10 rounded-lg flex items-center justify-center mb-4 text-foreground/70">
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-sm text-foreground/60 mb-6 leading-relaxed flex-1">
        {description}
      </p>

      {/* CTA */}
      {available ? (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-full transition-all text-sm font-medium text-foreground group w-fit">
          <span>Try now</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-xs font-mono text-foreground/40 w-fit">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Coming Soon</span>
        </div>
      )}
    </motion.div>
  );

  if (!available) {
    return <div>{content}</div>;
  }

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}

