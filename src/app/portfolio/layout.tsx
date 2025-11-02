import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio | Prayash Jung Khadka - Full-Stack Developer",
  description: "Full-Stack Developer portfolio. Specializing in React, Next.js, Node.js, TypeScript. View projects, experience, and skills.",
  keywords: ["Portfolio", "Full-Stack Developer", "React Developer", "Next.js Developer", "Prayash Khadka", "Web Developer", "Backend Developer"],
  openGraph: {
    title: "Portfolio | Prayash Jung Khadka",
    description: "Full-Stack Developer specializing in React, Next.js, Node.js, and TypeScript.",
    url: "https://prayash-portfolio.vercel.app/portfolio",
  },
  twitter: {
    title: "Portfolio | Prayash Jung Khadka",
    description: "Full-Stack Developer portfolio with projects and experience.",
  },
};

export default function PortfolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

