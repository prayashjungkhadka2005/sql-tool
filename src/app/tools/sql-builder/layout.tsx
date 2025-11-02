import type { Metadata } from "next";
import "@/styles/sql-builder.css";

export const metadata: Metadata = {
  title: "SQL Query Builder | Prayash Jung Khadka",
  description: "Visual SQL query builder for learning and building SELECT, INSERT, UPDATE, and DELETE queries. Perfect for backend developers getting started with SQL.",
  keywords: ["SQL", "Query Builder", "Database", "Learning Tool", "PostgreSQL", "MySQL", "SQL Tutorial"],
};

export default function SqlBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

