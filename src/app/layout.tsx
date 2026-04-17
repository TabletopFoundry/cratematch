import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CrateMatch",
    template: "%s | CrateMatch",
  },
  description: "A personalized board game subscription MVP with AI curation, collection intelligence, and monthly box previews.",
  openGraph: {
    title: "CrateMatch — Personalized Board Game Subscription",
    description: "Monthly board games matched to your taste profile and collection. Content-based curation with transparent explanations.",
    type: "website",
    locale: "en_US",
    siteName: "CrateMatch",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.85),transparent_38%),linear-gradient(180deg,#fff7ed_0%,#fffdfb_24%,#fff 100%)] text-stone-900">
        <div className="flex min-h-screen flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-orange-500 focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
