import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "Metabolic Intelligence Platform",
    template: "%s | Metabolic Intelligence",
  },
  description:
    "Trusted guidance for metabolic health and healthy aging — curated topics, expert consensus, and searchable clips.",
  openGraph: {
    title: "Metabolic Intelligence Platform",
    description:
      "A curated intelligence platform for fasting, nutrition, and metabolic health.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
          Curated metabolic health intelligence — synthesis over noise.
        </footer>
      </body>
    </html>
  );
}
