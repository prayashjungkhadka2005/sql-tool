import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://prayash-portfolio.vercel.app'),
  title: "Prayash Jung Khadka | Full-Stack JavaScript Developer",
  description: "Full-Stack JavaScript Developer specializing in React, Next.js, Node.js, and TypeScript. Building scalable web applications with PostgreSQL, MongoDB, AWS, and modern tech stack.",
  keywords: ["Full-Stack Developer", "JavaScript Developer", "React Developer", "Next.js Developer", "Node.js", "TypeScript", "Prayash Khadka", "Web Developer Nepal", "Backend Developer", "API Developer", "Upwork Developer"],
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
    title: "Prayash Jung Khadka | Full-Stack JavaScript Developer",
    description: "Full-Stack JavaScript Developer specializing in React, Next.js, Node.js, and TypeScript. Building scalable web applications with PostgreSQL, MongoDB, AWS, and modern tech stack.",
    type: "website",
    locale: "en_US",
    siteName: "Prayash Jung Khadka Portfolio",
    images: [
      {
        url: '/images/profile.jpg',
        width: 1200,
        height: 630,
        alt: 'Prayash Jung Khadka - Full-Stack JavaScript Developer',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prayash Jung Khadka | Full-Stack JavaScript Developer",
    description: "Building scalable web applications with modern technologies",
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

