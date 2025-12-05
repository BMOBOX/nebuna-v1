// app/stocks/StocksClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import router from "next/router";
import { date } from "yup";

type Order = {
  id: string;
  stock_name: string;
  type: "BUY" | "SELL";
  quantity: number;
  stock_price: number;
  created_at: string;
};

type MarketQuote = {
  symbol: string;
  regularMarketPrice: number;
  currency: string;
};

export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketQuote[]>([]);
  const [convertedPrices, setConvertedPrices] = useState<
    Record<number, number>
  >({});
  const [totalPL, setTotalPL] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  // Fetch user's orders
  useEffect(() => {
    fetch(`/api/user/${session?.user.id}/stocks`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [session?.user.id]);

  // Fetch real-time prices every 3 seconds
  useEffect(() => {
    if (orders.length === 0) return;

    const fetchPrices = async () => {
      const symbols = orders.map((o) => o.stock_name);
      const res = await fetch("/api/mquotes", {
        method: "POST",
        body: JSON.stringify({ symbols }),
      });
      const data = await res.json();
      setMarketPrices(data);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [orders]);

  // Convert prices to INR & calculate P&L
  useEffect(() => {
    const convertAndCalculate = async () => {
      let totalP = 0;
      let totalI = 0;
      const converted: Record<number, number> = {};

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const quote = marketPrices.find((q) => q.symbol === order.stock_name);
        if (!quote) continue;

        let inrPrice = quote.regularMarketPrice;
        if (quote.currency === "USD") {
          inrPrice *= 83.5; // Simple USD→INR (or use real API)
        }

        converted[i] = inrPrice;

        const pl = (inrPrice - order.stock_price) * order.quantity;
        totalP += order.type === "BUY" ? pl : -pl;
        totalI += order.stock_price * order.quantity;
      }

      setConvertedPrices(converted);
      setTotalPL(totalP);
      setTotalInvested(totalI);
    };

    convertAndCalculate();
  }, [marketPrices, orders]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "loading") return null;

  return (
    <>
      <div className="min-h-screen bg-black text-white p-6">
        {/* Stats Cards */}
        <div className="flex flex-wrap justify-center gap-8 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-zinc-400 text-sm font-medium">
              Wallet Balance
            </h3>
            <p className="text-4xl font-bold mt-2">₹{session?.user.wallet}</p>
            <p className="text-zinc-500 text-sm mt-2">
              Invested: ₹{totalInvested.toFixed(2)}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-zinc-400 text-sm font-medium">Total P&L</h3>
            <p
              className={`text-4xl font-bold mt-2 ${
                totalPL >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {totalPL >= 0 ? "+" : "-"}₹{Math.abs(totalPL).toFixed(2)}
            </p>
            <p
              className={`text-lg font-medium ${
                totalPL >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {totalPL >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(totalPL / totalInvested).toFixed(2)}%
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">Your Portfolio</h2>

        {/* Portfolio Table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full table-fixed">
            <thead className="bg-zinc-900">
              <tr className="text-left text-zinc-400 text-sm">
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4 text-right">Qty</th>
                <th className="px-4 py-4 text-right">Price</th>
                <th className="px-4 py-4 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    Loading your stocks...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    No stocks in portfolio yet.
                  </td>
                </tr>
              ) : (
                orders.map((order, i) => {
                  const currentPrice = convertedPrices[i] || order.stock_price;
                  const pl =
                    (currentPrice - order.stock_price) * order.quantity;
                  const plPercent =
                    ((currentPrice - order.stock_price) / order.stock_price) *
                    100;

                  return (
                    <tr
                      key={order.id}
                      className="border-t border-zinc-800 hover:bg-zinc-900/50 transition"
                    >
                      <td className="px-4 py-4 text-zinc-400">{i + 1}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/stocks/${order.stock_name}`}
                          className="text-blue-400 hover:underline"
                        >
                          {order.stock_name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.type === "BUY"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">{order.quantity}</td>
                      <td className="px-4 py-4 text-right font-medium">
                        ₹{order.stock_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div
                          className={
                            pl >= 0 ? "text-green-400" : "text-red-400"
                          }
                        >
                          <div className="font-semibold">
                            {pl >= 0 ? "+" : "-"}₹{Math.abs(pl).toFixed(2)}
                          </div>
                          <div className="text-xs">
                            {pl >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(plPercent).toFixed(2)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
