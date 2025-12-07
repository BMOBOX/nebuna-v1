import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Structure } from "./structure";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";

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
  let stocks: any[] = [];
  let symbols: string[] = [];

  let investedValue = 0;
  let currentValue = 0;

  if (session?.user?.user_id) {
    try {
      // 1️⃣ Fetch all user stocks
      const { data, error } = await supabase
        .from("stocks")
        .select("*")
        .eq("user_id", session.user.user_id);

      if (error) throw error;
      stocks = data || [];

      // 2️⃣ Extract symbols
      symbols = stocks.map((s) => s.stock_name);

      // 3️⃣ Fetch quotes if symbols exist
      if (symbols.length > 0) {
        const quotesRes = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/quotes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols }),
          }
        );

        if (quotesRes.ok) {
          const { data: quotesData } = await quotesRes.json();

          // map symbols → quote
          const quoteMap: Record<string, any> = {};
          quotesData.forEach((q: any) => {
            if (q.symbol && q.quote) quoteMap[q.symbol.toUpperCase()] = q.quote;
          });

          // 4️⃣ Attach quotes
          stocks = stocks.map((stock) => ({
            ...stock,
            quote: quoteMap[stock.stock_name] || null,
          }));
        }
      }

      // 5️⃣ Calculate invested & current value
      stocks.forEach((stock) => {
        const qty = Number(stock.quantity) || 0;
        const buyPrice = Number(stock.stock_price) || 0;

        investedValue += qty * buyPrice;

        const livePrice = stock.quote?.regularMarketPrice || 0;
        currentValue += qty * livePrice;
      });
    } catch (err) {
      console.error("Fetch stocks/quotes failed:", err);
    }
  }

  return (
    <Structure
      stocks={stocks}
      investedValue={investedValue}
      currentValue={currentValue}
    >
      {children}
    </Structure>
  );
}
