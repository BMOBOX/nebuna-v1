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

// --------- SERVER-SIDE CURRENCY CONVERTER ---------
async function convertToINR(amount: number, currency: string) {
  if (!currency || currency === "INR") return amount;

  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${currency}`
    );
    const data = await res.json();
    const rate = data.rates["INR"];
    return amount * rate;
  } catch {
    return amount;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  let stocks: any[] = [];
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

      const symbols = stocks.map((s) => s.stock_name);

      // 2️⃣ Fetch live quotes if symbols exist
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
          const quoteMap: Record<string, any> = {};

          quotesData.forEach((q: any) => {
            if (q.symbol && q.quote) quoteMap[q.symbol.toUpperCase()] = q.quote;
          });

          // 3️⃣ Attach quote, live price, and convert to INR
          stocks = await Promise.all(
            stocks.map(async (stock) => {
              const live = quoteMap[stock.stock_name.toUpperCase()] || null;
              const livePrice = live?.regularMarketPrice ?? 0;
              const currency = live?.currency || "INR";

              const liveINR = await convertToINR(livePrice, currency);

              return {
                ...stock,
                quote: live,
                live_price: livePrice, // raw live price
                liveINR, // live price in INR
              };
            })
          );
        } else {
          console.error("Quotes API failed:", await quotesRes.text());
        }
      }

      // 4️⃣ Calculate invested and current value
      stocks.forEach((stock) => {
        const qty = Number(stock.quantity) || 0;
        const buyPrice = Number(stock.stock_price) || 0;
        const livePrice = Number(stock.liveINR) || 0;

        investedValue += qty * buyPrice;
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
