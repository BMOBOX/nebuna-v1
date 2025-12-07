"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// ========== UNIVERSAL CURRENCY → INR CONVERTER ==========
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

export default function PortfolioTable({ stocks = [] }: { stocks?: any[] }) {
  const [items, setItems] = useState<any[]>(stocks);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========== FETCH LIVE QUOTES ==========
  const fetchQuotes = async (symbols: string[]) => {
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      const text = await res.text();
      if (!text) return {};
      const json = JSON.parse(text);

      const map: Record<string, any> = {};
      (json.data || []).forEach((q: any) => (map[q.symbol] = q.quote));

      return map;
    } catch (err) {
      console.error("Portfolio quotes fetch failed:", err);
      return {};
    }
  };

  // ========== UPDATE QUOTES EVERY 2 SECONDS ==========
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const symbols = items.map((i) => i.stock_name);
      if (!symbols.length) return;

      const map = await fetchQuotes(symbols);

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          quote: map[item.stock_name] || item.quote,
        }))
      );
    }, 2000);

    return () => clearInterval(intervalRef.current as NodeJS.Timeout);
  }, [items]);

  // ========== CONVERT LIVE PRICES TO INR ==========
  useEffect(() => {
    async function convertPrices() {
      const updated = await Promise.all(
        items.map(async (item) => {
          const quote = item.quote || {};
          const price = quote?.regularMarketPrice || 0;
          const currency = quote?.currency || "INR";

          const liveINR = await convertToINR(price, currency);

          return { ...item, liveINR };
        })
      );

      setItems(updated);
    }

    convertPrices();
  }, [items.map((i) => i.quote?.regularMarketPrice).join(",")]);

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value || 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Stock Name</TableHead>
          <TableHead>Bought On</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Buy Price</TableHead>
          <TableHead className="text-right">Current Price</TableHead>
          <TableHead className="text-right">P&L</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item, index) => {
          const quote = item.quote || {};
          const live = item.liveINR || 0;
          const buy = item.stock_price;

          const totalBuy = buy * item.quantity;
          const totalLive = live * item.quantity;
          const pnl = totalLive - totalBuy;

          return (
            <TableRow key={item.stock_name + index}>
              {/* TYPE */}
              <TableCell>
                <Badge
                  className={
                    item.type === "BUY"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {item.type}
                </Badge>
              </TableCell>

              {/* SYMBOL */}
              <TableCell>
                <Link
                  href={`/stocks/${item.stock_name}`}
                  className="text-blue-500 hover:underline"
                >
                  {item.stock_name}
                </Link>
              </TableCell>

              {/* STOCK NAME */}
              <TableCell>{quote.shortName || "-"}</TableCell>

              {/* DATE */}
              <TableCell>
                {new Date(item.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>

              {/* QTY */}
              <TableCell className="text-right">{item.quantity}</TableCell>

              {/* BUY PRICE */}
              <TableCell className="text-right">{formatINR(buy)}</TableCell>

              {/* LIVE PRICE IN INR */}
              <TableCell className="text-right">{formatINR(live)}</TableCell>

              {/* PNL */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {pnl > 0 && (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  )}
                  {pnl < 0 && (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}

                  <span
                    className={`font-semibold ${
                      pnl > 0
                        ? "text-green-600"
                        : pnl < 0
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {formatINR(pnl)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
