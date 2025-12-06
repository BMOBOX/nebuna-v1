import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Structure } from "./structure";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  let watchlist: any[] = [];
  let symbols: string[] = [];

  if (session?.user?.user_id) {
    try {
      // 1. Fetch user's watchlist
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/watchlist/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.user_id }),
          cache: "no-cache",
        }
      );

      if (res.ok) {
        const data = await res.json();
        watchlist = data.watchlist || [];

        // Extract symbol list
        symbols = watchlist.map((item: any) => item.symbol);
      }

      // 2. Fetch stock quotes for ALL symbols
      if (symbols.length > 0) {
        const quotesRes = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/quotes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols }),
            cache: "no-cache",
          }
        );

        if (quotesRes.ok) {
          const { data: quotes } = await quotesRes.json();

          // 3. Attach quote to each watchlist item
          watchlist = watchlist.map((item) => {
            const q = quotes.find((i: any) => i.symbol === item.symbol);
            return {
              ...item,
              quote: q?.quote || null,
            };
          });
        }
      }
    } catch (err) {
      console.error("Fetch watchlist/quotes failed:", err);
    }
  }

  return (
    <Structure watchlist={watchlist} user={session?.user}>
      {children}
    </Structure>
  );
}
