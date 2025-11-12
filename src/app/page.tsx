"use client";

import { motion } from "framer-motion";
import Navbar from "@/features/sql-builder/components/Navbar";
import Footer from "@/features/sql-builder/components/Footer";
import Hero from "@/features/landing/components/Hero";
import ToolCard from "@/features/landing/components/ToolCard";

export default function Home() {
  const tools = [
    {
      title: "SQL Query Builder",
      description: "Build SELECT, INSERT, UPDATE, DELETE queries visually with real-time code generation. Export to CSV, JSON, SQL. Perfect for learning SQL syntax.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      href: "/tools/sql-builder",
      badge: "BETA",
      available: true,
    },
    {
      title: "MongoDB Query Builder",
      description: "Build MongoDB queries visually with aggregation pipeline support. Learn NoSQL query syntax with real-time examples.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      href: "#",
      available: false,
    },
    {
      title: "GraphQL Builder",
      description: "Build GraphQL queries and mutations visually. Test with mock data and learn GraphQL syntax interactively.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: "#",
      available: false,
    },
    {
      title: "Database Schema Visualizer",
      description: "Visualize database relationships and schema. Generate ER diagrams from SQL CREATE statements automatically.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: "#",
      available: false,
    },
    {
      title: "SQL Formatter",
      description: "Format and beautify SQL queries with proper indentation and syntax highlighting. Auto-format as you type with live preview.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      ),
      href: "/tools/sql-formatter",
      badge: "NEW",
      available: true,
    },
    {
      title: "Query Performance Analyzer",
      description: "Analyze SQL query performance and get optimization suggestions. Learn best practices for faster queries.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: "#",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Hero */}
        <Hero />

        {/* Tools Grid */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Available Tools
              </h2>
              <p className="text-sm text-foreground/60 font-mono">
                → Choose a tool to get started
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tools.map((tool, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <ToolCard {...tool} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
