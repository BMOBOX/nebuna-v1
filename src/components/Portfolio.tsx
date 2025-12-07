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

export default function PortfolioTable({ stocks }: { stocks?: any[] }) {
  const [items, setItems] = useState<any[]>(stocks || []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live quotes
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
      console.error("Failed to fetch portfolio quotes:", err);
      return {};
    }
  };

  // 🔥 Always keep updating like Watchlist
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

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items]); // same logic as WatchlistTable

  const formatPrice = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Stock Name</TableHead>
          <TableHead>Bought On</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Current Price</TableHead>
          <TableHead className="text-right">P&L</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item, index) => {
          const quote = item.quote || {};
          const price = quote.regularMarketPrice ?? 0;
          const percent =
            item.stock_price * item.quantity -
            quote.regularMarketPrice * item.quantity;

          return (
            <TableRow key={item.stock_name + index}>
              <TableCell>
                <Badge
                  variant="default"
                  className={
                    item.type === "BUY"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 text-gray-100 hover:bg-red-700"
                  }
                >
                  {item.type}
                </Badge>
              </TableCell>

              <TableCell>
                <Link
                  href={`/stocks/${item.stock_name}`}
                  className="text-blue-500 hover:underline"
                >
                  {item.stock_name}
                </Link>
              </TableCell>

              <TableCell>{quote.shortName || "-"}</TableCell>

              <TableCell>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </TableCell>

              <TableCell className="text-right">{item.quantity}</TableCell>

              <TableCell className="text-right font-medium">
                ₹{item.stock_price}
              </TableCell>

              <TableCell className="text-right font-medium">₹{price}</TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {percent > 0 && (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  )}
                  {percent < 0 && (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`font-semibold ${
                      percent > 0
                        ? "text-green-600"
                        : percent < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatPrice(percent, item.quote.currency)}
                    {percent > 0 ? "+" : ""}
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
