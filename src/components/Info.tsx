"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// ---------- SERVER OR CLIENT CURRENCY CONVERTER ----------
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

export default function PnLCard({
  stocks,
  investedValue_: investedInit,
  currentValue_: currentInit,
}: {
  stocks?: any[];
  investedValue_?: number;
  currentValue_?: number;
}) {
  const [items, setItems] = useState(stocks || []);
  const [investedValue, setInvestedValue] = useState(investedInit || 0);
  const [currentValue, setCurrentValue] = useState(currentInit || 0);

  // Fetch live quotes
  const fetchQuotes = async (symbols: string[]) => {
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      const data = await res.json();
      const map: Record<string, any> = {};
      (data.data || []).forEach((q: any) => (map[q.symbol] = q.quote));
      return map;
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
      return {};
    }
  };

  // Update P&L with live INR prices
  const updatePnL = async () => {
    const symbols = items.map((i) => i.stock_name);
    if (!symbols.length) return;

    const map = await fetchQuotes(symbols);

    let invested = 0;
    let current = 0;

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const quote = map[item.stock_name] || item.quote;
        const qty = Number(item.quantity) || 0;
        const buyPrice = Number(item.stock_price) || 0;

        invested += qty * buyPrice;

        const livePrice = quote?.regularMarketPrice ?? buyPrice;
        const currency = quote?.currency || "INR";

        const liveINR = await convertToINR(livePrice, currency);
        current += qty * liveINR;

        return { ...item, quote, liveINR };
      })
    );

    setItems(updatedItems);
    setInvestedValue(invested);
    setCurrentValue(current);
  };

  useEffect(() => {
    updatePnL(); // initial calculation
    const interval = setInterval(updatePnL, 2000); // update every 2s
    return () => clearInterval(interval);
  }, [items]);

  const pnl = currentValue - investedValue;
  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
  const isProfit = pnl > 0;
  const isLoss = pnl < 0;

  return (
    <div className="w-full max-w-sm p-4 rounded-xl bg-zinc-900/40 border shadow-sm flex flex-col gap-4 mb-8">
      <div>
        <h2 className="text-xl font-semibold">Portfolio Summary</h2>
        <p className="text-sm text-muted-foreground">
          Live performance of your holdings
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Invested Value</span>
          <span className="font-medium">₹{investedValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Current Value</span>
          <span className="font-medium">₹{currentValue.toLocaleString()}</span>
        </div>
      </div>

      <hr className="border-muted" />

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Overall P&L</p>
          <h3
            className={`text-2xl font-bold ${
              isProfit
                ? "text-green-600"
                : isLoss
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          >
            ₹{pnl.toLocaleString()}
          </h3>
        </div>

        <div
          className={`flex items-center gap-1 text-lg font-semibold ${
            isProfit
              ? "text-green-600"
              : isLoss
              ? "text-red-600"
              : "text-muted-foreground"
          }`}
        >
          {isProfit && <ArrowUpRight className="w-5 h-5" />}
          {isLoss && <ArrowDownRight className="w-5 h-5" />}
          {pnlPercent > 0 ? "+" : ""}
          {pnlPercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
