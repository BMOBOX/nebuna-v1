import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Structure } from "./structure";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { gettransaction } from "@/services/stock";
import { redirect } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nebuna | From paper to profit",
  description:
    "Experience paper trading with real-time data, live charts, and a clean user interface.",
  keywords: [
    "paper trading",
    "stock simulator",
    "real-time trading",
    "investing",
    "Nebuna",
  ],
  authors: [{ name: "Nebuna Team", url: "https://nebuna.vercel.app" }],
  creator: "Nebuna",
  metadataBase: new URL("https://nebuna.vercel.app"),
  openGraph: {
    title: "Nebuna | Paper Trading Website",
    description: "Trade virtual stocks in real time. Learn. Practice. Grow.",
    url: "https://nebuna.vercel.app",
    siteName: "Nebuna",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nebuna | Paper Trading Website",
    description: "Practice stock trading risk-free with Nebuna.",
    creator: "@nebuna_app",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Server-side session check
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session?.user) {
    redirect("/signin"); // works in server components
  }

  // Fetch transactions
  const transaction = await gettransaction();

  return <Structure transaction={transaction}>{children}</Structure>;
}
