import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import "@/styles/sql-builder.css";

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://prayash-portfolio.vercel.app'),
  title: "SQL Query Builder | Visual SQL Learning Tool - Free",
  description: "Free visual SQL query builder for developers. Build SELECT, INSERT, UPDATE, DELETE queries with real-time code generation. Export to CSV, JSON, SQL. Perfect for learning SQL syntax.",
  keywords: ["SQL Query Builder", "SQL Generator", "Visual SQL", "SQL Learning Tool", "Database Query Builder", "SQL Tutorial", "Free SQL Tool", "Backend Developer Tools", "PostgreSQL", "MySQL", "Learn SQL", "SQL Syntax", "Prayash Khadka"],
  authors: [{ name: "Prayash Jung Khadka" }],
  creator: "Prayash Jung Khadka",
  publisher: "Prayash Jung Khadka",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
  },
  verification: {
    google: 'BHNtNhPfKfSpVEQ2gy1_NlDDTnbS8_ovvO24PXpou4Q',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/favicon_io/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon_io/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "SQL Query Builder | Free Visual SQL Tool",
    description: "Free visual SQL query builder. Build queries with real-time code generation, export results to CSV/JSON/SQL. Perfect for learning SQL syntax.",
    type: "website",
    locale: "en_US",
    siteName: "SQL Query Builder by Prayash",
    images: [
      {
        url: '/images/profile.jpg',
        width: 1200,
        height: 630,
        alt: 'SQL Query Builder - Visual SQL Learning Tool',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Query Builder | Free Visual SQL Tool",
    description: "Build SQL queries visually with real-time code generation. Export to CSV, JSON, SQL. Free tool for developers.",
    creator: "@prayashjungkhadka",
    images: ['/images/profile.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth transition-colors duration-200">
      <body className={`${dmSans.className} antialiased`}>{children}</body>
    </html>
  );
}

