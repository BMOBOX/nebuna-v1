"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Chart from "@/components/Charts";
import { useParams } from "next/navigation";
import Wallet from "@/components/Wallet";

export default function StockPage() {
  const params = useParams();
  const stock = params.stock;
  const { data: session, status } = useSession();

  const [data, setData] = useState<any>(null);
  const [inrPrice, setInrPrice] = useState(0);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [watch, setWatch] = useState<any[]>([]);
  const [watchlist, setWatchList] = useState(false);
  const [interval, setInterval] = useState("5m");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") window.location.href = "/signin";
  }, [status]);

  useEffect(() => {
    fetch(`/api/quotes/${stock}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const converted =
          d.currency === "USD"
            ? d.regularMarketPrice * 83.5
            : d.regularMarketPrice;
        setInrPrice(converted);
        if (d.currency !== "INR") setPrice(d.regularMarketPrice);
      });
  }, [stock]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user/${session.user.id}/stocks`)
        .then((r) => r.json())
        .then(setOrders);
      fetch(`/api/user/${session.user.id}/watchlist`)
        .then((r) => r.json())
        .then(setWatch);
    }
  }, [session]);

  useEffect(() => {
    if (data && watch.length > 0) {
      setWatchList(watch.some((w) => w.symbol === data.symbol));
    }
  }, [data, watch]);

  const owned = orders.find((o) => o.stock_name === stock);
  const profitLoss = owned
    ? (inrPrice - owned.stock_price) * owned.quantity
    : 0;

  const handleKeypress = (e: any) => {
    if (!/[0-9]|Backspace/.test(e.key)) e.preventDefault();
  };

  if (!data || status === "loading")
    return (
      <div className="flex items-center justify-center h-screen text-white text-2xl">
        Loading...
      </div>
    );

  return (
    <div className="bg-zinc-900 min-h-screen text-white px-4 md:px-8 py-6">
      {/* Header / Back */}
      <Link
        href="/dashboard"
        className="inline-block mb-6 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 transition font-medium"
      >
        ← Back to Dashboard
      </Link>

      {/* Stock Info & Wallet */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        {/* Stock Card */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg w-full lg:max-w-lg">
          <h1 className="text-3xl font-bold">{data.shortName}</h1>
          <p className="text-gray-400">{data.symbol}</p>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-5xl font-extrabold">
              ₹{Math.round(inrPrice * 100) / 100}
            </span>
            {price > 0 && (
              <span className="text-gray-400 text-lg">
                (${Math.round(price * 100) / 100})
              </span>
            )}
          </div>
        </div>

        {/* Wallet */}
        <Wallet user={session?.user} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-gray-800 relative shadow-lg col-span-2">
          <select
            className="absolute top-2 left-2 z-10 bg-gray-700 text-white rounded px-3 py-1 text-sm"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option>1m</option>
            <option>5m</option>
            <option>15m</option>
            <option>1h</option>
            <option>1d</option>
          </select>
          <Chart interval={interval} />
        </div>

        {/* Buy/Sell Panel */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-6 shadow-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{stock}</h2>
            <button
              onClick={() => setWatchList(!watchlist)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                watchlist
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {watchlist ? "Remove" : "Add"} Watchlist
            </button>
          </div>

          {/* Analyst Rating */}
          <div className="bg-gray-700 p-4 rounded-lg text-center shadow-inner">
            <p className="text-gray-300">Analyst Rating</p>
            <p className="text-xl font-bold mt-2">
              {data.averageAnalystRating || "N/A"}
            </p>
          </div>

          {/* Market Info */}
          <div className="flex justify-between items-center text-gray-300">
            <span>Market Volume</span>
            <span className="bg-gray-700 px-3 py-1 rounded">
              {data.regularMarketVolume}
            </span>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p>Daily Low</p>
              <span className="bg-gray-700 mt-1 block py-1 rounded">
                ${data.regularMarketDayRange?.low}
              </span>
            </div>
            <div className="flex-1 text-center">
              <p>Daily High</p>
              <span className="bg-gray-700 mt-1 block py-1 rounded">
                ${data.regularMarketDayRange?.high}
              </span>
            </div>
          </div>

          {/* P&L or Buy/Sell */}
          <div className="border-t border-gray-600 pt-4">
            {owned ? (
              <div className="text-center">
                <p className="text-2xl font-bold mb-4">
                  P&L:{" "}
                  <span
                    className={
                      profitLoss >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {profitLoss >= 0 ? "+" : "-"}₹
                    {Math.abs(profitLoss)?.toFixed(2)}
                  </span>
                </p>
                <button className="w-full bg-red-600 hover:bg-red-500 rounded-lg py-3 font-semibold transition">
                  Close Position
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-center text-gray-300">
                  You do not own this stock.
                </p>
                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-lg font-semibold transition"
                    onClick={() =>
                      (document.getElementById("buy_modal") as any)?.showModal()
                    }
                  >
                    BUY
                  </button>
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-lg font-semibold transition"
                    onClick={() =>
                      (
                        document.getElementById("sell_modal") as any
                      )?.showModal()
                    }
                  >
                    SELL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BUY MODAL */}
      <dialog id="buy_modal" className="modal">
        <div className="modal-box bg-zinc-900 rounded-2xl p-8 w-[90%] max-w-lg shadow-xl">
          <h3 className="text-3xl font-bold mb-6 text-white">
            {data.shortName}
          </h3>
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Quantity</span>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={handleKeypress}
                className="input input-bordered w-28 bg-gray-800 text-white border-gray-700 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Market Price</span>
              <span className="bg-gray-800 text-white px-4 py-1 rounded">
                ₹{Math.round(inrPrice * 100) / 100}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-sm">
              <span>Balance: ₹{session?.user.wallet}</span>
              <span>
                Required: ₹{(Number(quantity || 0) * inrPrice)?.toFixed(2)}
              </span>
            </div>
            {message && (
              <div className="text-red-500 text-center">{message}</div>
            )}
            <button className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-semibold w-full transition">
              Buy
            </button>
          </div>
        </div>
      </dialog>

      {/* SELL MODAL */}
      <dialog id="sell_modal" className="modal">
        <div className="modal-box bg-zinc-900 rounded-2xl p-8 w-[90%] max-w-lg shadow-xl">
          <h3 className="text-3xl font-bold mb-6 text-white">
            Sell {data.shortName}
          </h3>
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Quantity</span>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={handleKeypress}
                className="input input-bordered w-28 bg-gray-800 text-white border-gray-700 focus:border-red-500"
              />
            </div>
            <button className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-semibold w-full transition">
              Sell
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
