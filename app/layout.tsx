import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/support/SupportWidget";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Your Life Protocol — Personalized Supplement Protocols",
    template: "%s — Your Life Protocol",
  },
  description:
    "Supplement :: LIFE pairs a short guided intake with time-tested herbal formulations, matched to your biology. Reserve your spot for first access today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-navy selection:bg-copper/20 selection:text-navy">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <SupportWidget />
      </body>
    </html>
  );
}
