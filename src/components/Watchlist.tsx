"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Session } from "next-auth";

export default function WatchlistTable({
  data,
  user,
}: {
  data?: any[];
  user?: Session["user"];
}) {
  const [items, setItems] = useState(data || []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch quotes
  const fetchQuotes = async (symbols: string[]) => {
    if (!symbols.length) return {};
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
      console.error("Failed to fetch quotes:", err);
      return {};
    }
  };

  // Live update quotes every 2s
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const symbols = items.map((i) => i.symbol);
      if (!symbols.length) return;
      const map = await fetchQuotes(symbols);
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          quote: map[item.symbol] || item.quote,
        }))
      );
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items]); // keep [items] here for live update of current symbols

  // Remove item
  const handleRemove = async (symbol: string) => {
    try {
      // Remove from backend
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.user_id,
          symbol,
          action: "remove",
        }),
      });
      const updated = await res.json();

      const symbols = updated.map((i: any) => i.symbol);
      const map = await fetchQuotes(symbols);

      // Merge quotes into updated list
      setItems(
        updated.map((item: any) => ({
          ...item,
          quote: map[item.symbol],
        }))
      );
    } catch (err) {
      console.error("Remove failed:", err);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Watchlist ({items.length})
      </h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Stock Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">% Change</TableHead>
            <TableHead className="text-center">Analyst Rating</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item, index) => {
            const q = item.quote || {};
            const price = q.regularMarketPrice ?? 0;
            const percent = q.regularMarketChangePercent ?? 0;
            const volume = q.regularMarketVolume ?? "--";

            return (
              <TableRow key={item.symbol}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>

                <TableCell>
                  <Link
                    href={`/stocks/${item.symbol}`}
                    className="text-blue-500 hover:underline"
                  >
                    {item.symbol}
                  </Link>
                </TableCell>

                <TableCell className="capitalize">
                  {q.shortName || "-"}
                </TableCell>

                <TableCell className="text-right font-medium">
                  ₹{price.toLocaleString()}
                </TableCell>

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
                      {percent > 0 ? "+" : ""}
                      {percent.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  {q.averageAnalystRating || "-"}
                </TableCell>

                <TableCell className="text-right">
                  {volume.toLocaleString()}
                </TableCell>

                <TableCell className="text-right flex justify-end">
                  <button
                    onClick={() => handleRemove(item.symbol)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 hover:cursor-pointer underline"
                  >
                    Remove
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
