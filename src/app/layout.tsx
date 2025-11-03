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
  title: "SQL & Database Tools | Free Developer Utilities by Prayash",
  description: "Free visual tools for backend developers. SQL Query Builder, MongoDB Builder, GraphQL Builder and more. Build queries, learn database syntax, export data. No signup required.",
  keywords: ["SQL Query Builder", "Database Tools", "Developer Tools", "SQL Generator", "MongoDB Builder", "GraphQL Builder", "Backend Tools", "Free SQL Tool", "Visual Query Builder", "Learn SQL", "PostgreSQL", "MySQL", "NoSQL", "Prayash Khadka"],
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
    title: "SQL & Database Tools | Free Developer Utilities",
    description: "Free visual tools for backend developers. SQL Query Builder, MongoDB Builder, GraphQL Builder. Build queries, learn database syntax, export data.",
    type: "website",
    locale: "en_US",
    siteName: "Developer Tools by Prayash",
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
    title: "SQL & Database Tools | Free Developer Utilities",
    description: "Free visual tools for backend developers. SQL Query Builder and more. Build queries, learn database syntax.",
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

