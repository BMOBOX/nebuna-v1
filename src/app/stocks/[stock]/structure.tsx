"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Chart from "@/components/Charts";
import { useParams } from "next/navigation";
import Wallet from "@/components/Wallet";
import Search from "@/components/Search";
import { toast } from "react-toastify";
import { sell, close, buy } from "@/services/functioning";

export function Structure({
  children,
  watchlist_,
  orders_,
}: {
  children: React.ReactNode;
  watchlist_?: boolean;
  orders_?: any[];
}) {
  const params = useParams();
  const stock = params.stock;
  const { data: session, status } = useSession();
  const [type_, setType] = useState("");
  const [priceu, setPriceu] = useState(0);
  const [owned, setOwned] = useState<any>();
  const [profitLoss, setProfitLoss] = useState(0);
  const [data, setData] = useState<any>(null);
  const [inrPrice, setInrPrice] = useState(0);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [orders, setOrders] = useState<any[]>(orders_ || []);
  const [watch, setWatch] = useState<boolean>(watchlist_!);
  const [watchlist, setWatchList] = useState(false);
  const [interval, setInterval] = useState("5m");
  const [message, setMessage] = useState("");

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);

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
    if (watch) {
      setWatchList(!watchlist);
    }
  }, [watch]);

  async function toggleWatchlist() {
    if (!session?.user?.id || !data?.symbol) return;

    try {
      const res = await fetch(`/api/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.user.user_id,
          symbol: data.symbol,
          action: watchlist ? "remove" : "add", // toggles dynamically
        }),
      });

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return null;
      }

      if ((watchlist ? "remove" : "add") === "add") {
        toast.success("Added to Watchlist!");
      } else toast.error("Removed from Watchlist!");
      setWatchList(!watchlist);

      return data; // updated list
    } catch (err) {
      toast.error("Network error");
      return null;
    }
  }

  useEffect(() => {
    const filtered = orders.filter((o) => o.stock_name === stock);

    if (filtered.length === 0) {
      setOwned(0);
      setProfitLoss(0);
      return;
    }

    // Net quantity = shares currently held
    const netQuantity = filtered.reduce((sum, o) => {
      return sum + (o.type === "BUY" ? o.quantity : -o.quantity);
    }, 0);

    setOwned(netQuantity);
    setPriceu(filtered[0].stock_price);
    setType(filtered[0].type);

    // Total and Qty for BUY orders only
    const totalBuy = filtered
      .filter((o) => o.type === "BUY")
      .reduce((sum, o) => sum + o.stock_price * o.quantity, 0);

    const qtyBuy = filtered
      .filter((o) => o.type === "BUY")
      .reduce((sum, o) => sum + o.quantity, 0);

    // If user sold ALL shares → no avg price
    if (qtyBuy === 0 || netQuantity === 0) {
      setProfitLoss(0);
      return;
    }

    const avgBuyPrice = totalBuy / qtyBuy;

    const pl = (inrPrice - avgBuyPrice) * netQuantity;

    setProfitLoss(pl);
  }, [orders, inrPrice, stock]);

  const handleKeypress = (e: any) => {
    if (!/[0-9]|Backspace/.test(e.key)) e.preventDefault();
  };

  if (!data || status === "loading") return null;

  async function handleBuy(): Promise<void> {
    if (!session?.user?.user_id || !data?.symbol || !quantity) return;

    try {
      const resp = await buy(
        session.user.user_id,
        data.symbol,
        quantity,
        inrPrice
      );

      if (resp.success) {
        toast.success(resp.message || "Order placed!");

        // 1️⃣ Update wallet in session
        session.user.wallet = resp.remainingWallet;

        // 2️⃣ Add the purchased stock to orders state
        setOrders((prev) => [
          ...prev.filter((o) => o.stock_name !== data.symbol), // remove old entry if exists
          {
            stock_name: data.symbol,
            stock_price: inrPrice,
            quantity: Number(quantity),
            type: "BUY",
          },
        ]);

        setBuyModalOpen(false); // close the buy modal
      } else {
        toast.error(resp.error || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  async function handleSell(): Promise<void> {
    if (!session?.user?.user_id || !data?.symbol || !quantity) return;

    try {
      const resp = await sell(
        session.user.user_id,
        data.symbol,
        quantity,
        inrPrice
      );

      if (resp.success) {
        toast.success(resp.message || "Order placed!");

        // 1️⃣ Update wallet in session (if needed)
        session.user.wallet = resp.remainingWallet;

        // 2️⃣ Add the sold stock to orders state
        setOrders((prev) => [
          ...prev.filter((o) => o.stock_name !== data.symbol), // remove old entry if exists
          {
            stock_name: data.symbol,
            stock_price: inrPrice,
            quantity: Number(quantity),
            type: "SELL",
          },
        ]);

        setSellModalOpen(false);
      } else {
        toast.error(resp.error || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  console.log(data);

  async function closePosition(): Promise<void> {
    if (!session?.user?.user_id || !data?.symbol || !owned) return;

    try {
      // Sell all shares
      const resp = await close(
        data.symbol,
        session.user.user_id,
        data.shortName,
        owned,
        priceu,
        inrPrice,
        type_
      );

      if (resp.success) {
        toast.success(resp.message || "Position closed!");

        // Update wallet in session
        session.user.wallet = resp.remainingWallet;

        // Remove this stock from orders
        setOrders((prev) => prev.filter((o) => o.stock_name !== data.symbol));

        // Reset owned and profit/loss
        setOwned(0);
        setProfitLoss(0);
      } else {
        toast.error(resp.error || "Failed to close position");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  const formatPrice = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <>
      <div className="flex flex-col bg-zinc-900 min-h-screen text-white px-4 md:px-8 py-6">
        {/* Header / Back + Wallet */}
        <div className="w-full flex justify-between items-center mb-2">
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 rounded-md hover:bg-zinc-800/30 transition font-medium hover:cursor-pointer"
          >
            ← Back to Dashboard
          </Link>

          <div className="w-64 flex justify-end">
            <Search />
          </div>
        </div>

        {/* Header with Centered Card and Wallet on Right */}
        <div className="w-full flex items-center justify-center mb-8 relative">
          {/* Centered Stock Card */}
          <div className="bg-zinc-800/30 rounded-xl p-4 shadow-xl w-full max-w-sm border border-zinc-800">
            <div className="text-center">
              <h1 className="text-xl font-semibold">{data.shortName}</h1>
              <p className="text-gray-400 text-sm">{data.symbol}</p>
            </div>

            <div className="mt-4 flex justify-center items-baseline">
              <span className="text-3xl font-bold">
                ₹{Math.round(inrPrice * 100) / 100}
              </span>

              {data.currency != "INR" && (
                <span className="ml-2 text-gray-400 text-base">
                  ({formatPrice(Math.round(price * 100) / 100, data.currency)})
                </span>
              )}
            </div>
          </div>

          {/* Wallet on right side */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-56 flex justify-end">
              <Wallet user={session?.user} />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div
          className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ minHeight: "500px" }}
        >
          {/* Chart */}
          <div className=" relative shadow-lg col-span-2 flex flex-col h-full">
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

            <div className="flex-1 relative w-full">
              <Chart interval={interval} />
            </div>
          </div>

          {/* Buy/Sell Panel */}
          <div className="bg-zinc-900/50 rounded-md p-6 flex flex-col gap-6 shadow-xl border border-zinc-800 backdrop-blur-sm h-full">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">{stock}</h2>

              <button
                onClick={toggleWatchlist}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  watchlist
                    ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 hover:cursor-pointer"
                    : "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 hover:cursor-pointer"
                }`}
              >
                {watchlist ? "Remove Watchlist" : "Add Watchlist"}
              </button>
            </div>

            {/* Analyst Rating */}
            <div className="bg-zinc-800/50 p-2 rounded-xl text-center border border-zinc-700">
              <p className="text-gray-400 text-sm">Analyst Rating</p>
              <p className="text-2xl font-bold mt-2 text-white">
                {data.averageAnalystRating || "N/A"}
              </p>
            </div>

            {/* Market Info */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-gray-300 text-sm">
                <span>Market Volume</span>
                <span className="bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700 w-36 text-center">
                  {data.regularMarketVolume?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-300 text-sm">
                <span>52-Week Range</span>
                <span className="bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700 w-36 text-center">
                  {data.fiftyTwoWeekLow} - {data.fiftyTwoWeekHigh}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-300 text-sm">
                <span>P/E Ratio</span>
                <span className="bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700 w-36 text-center">
                  {data.trailingPE}
                </span>
              </div>
            </div>

            {/* Day Range */}
            <div className="flex gap-4">
              <div className="flex-1 text-center">
                <p className="text-gray-400 text-sm">Daily High</p>
                <span className="bg-zinc-800/60 mt-1 block py-1.5 rounded-lg border border-zinc-700 text-white">
                  {formatPrice(data.regularMarketDayRange?.high, data.currency)}
                </span>
              </div>
              <div className="flex-1 text-center">
                <p className="text-gray-400 text-sm">Daily Low</p>
                <span className="bg-zinc-800/60 mt-1 block py-1.5 rounded-lg border border-zinc-700 text-white">
                  {formatPrice(data.regularMarketDayRange?.low, data.currency)}
                </span>
              </div>
            </div>

            {/* P&L / Buy Sell Section */}
            <div className="border-t border-zinc-700 pt-4">
              {owned ? (
                <div className="text-center">
                  <p className="text-xl font-semibold mb-4 text-gray-300">
                    P&L:{" "}
                    <span
                      className={
                        profitLoss >= 0 ? "text-green-400" : "text-red-400"
                      }
                    >
                      {profitLoss >= 0 ? "+" : "-"}₹
                      {Math.abs(profitLoss).toFixed(2)}
                    </span>
                  </p>

                  <button
                    className="w-full bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 rounded-md py-3 font-semibold transition hover:cursor-pointer"
                    onClick={closePosition}
                  >
                    Close Position
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-center text-gray-400 text-sm">
                    You do not own this stock.
                  </p>

                  <div className="flex gap-4">
                    <button
                      className="flex-1 bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 py-3 rounded-md font-semibold transition hover:cursor-pointer"
                      onClick={() => setBuyModalOpen(true)}
                    >
                      BUY
                    </button>

                    <button
                      className="flex-1 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 py-3 rounded-md font-semibold transition hover:cursor-pointer"
                      onClick={() => setSellModalOpen(true)}
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
        {buyModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
            onClick={() => setBuyModalOpen(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-md p-6 w-[90%] max-w-md shadow-xl backdrop-blur-sm flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center gap-6">
                <h3 className="text-xl font-semibold text-white">
                  {data.shortName}
                </h3>
                <button
                  onClick={() => setBuyModalOpen(false)}
                  className="text-gray-400 hover:text-white font-bold text-lg hover:cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Quantity */}
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const maxAffordable = Math.floor(
                        (session?.user.wallet ?? 0) / (inrPrice || 1)
                      );
                      setQuantity(
                        val > maxAffordable
                          ? maxAffordable.toString()
                          : val.toString()
                      );
                    }}
                    onKeyDown={handleKeypress}
                    className={`bg-zinc-800/60 border ${
                      Number(quantity || 0) * inrPrice >
                      (session?.user.wallet || 0)
                        ? "border-red-500"
                        : "border-zinc-700"
                    } rounded-md text-white text-center px-3 py-1 w-28 focus:outline-none focus:border-green-500`}
                  />
                </div>

                {/* Market Price */}
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Market Price</span>
                  <span className="bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700 w-28 text-center">
                    ₹{Math.round(inrPrice * 100) / 100}
                  </span>
                </div>

                {/* Balance & Required */}
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Total: </span>
                  <span
                    className={`bg-zinc-800/60 px-3 py-1 rounded-md w-28 text-center border ${
                      Number(quantity || 0) * inrPrice >
                      (session?.user.wallet || 0)
                        ? "border-red-500 text-red-500"
                        : "border-zinc-700"
                    }`}
                  >
                    ₹{(Number(quantity || 0) * inrPrice).toFixed(2)}
                  </span>
                </div>

                {message && (
                  <div className="text-red-500 text-center">{message}</div>
                )}
              </div>

              <div className="flex justify-between items-center text-gray-300 text-sm border-t border-zinc-700/80 pt-4 mt-4">
                <span>Balance:</span>
                <span
                  className={`bg-zinc-800/60 px-3 py-1 rounded-md w-28 text-center border border-zinc-700`}
                >
                  ₹{session?.user.wallet}
                </span>
              </div>

              <button
                className="bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 py-3 rounded-md hover:cursor-pointer font-semibold w-full transition"
                disabled={
                  Number(quantity || 0) * inrPrice > (session?.user.wallet || 0)
                }
                onClick={handleBuy}
              >
                Buy
              </button>
            </div>
          </div>
        )}

        {/* SELL MODAL */}
        {sellModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
            onClick={() => setSellModalOpen(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-md p-6 w-[90%] max-w-md shadow-xl backdrop-blur-sm flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center gap-6">
                <h3 className="text-xl font-semibold text-white">
                  {data.shortName}
                </h3>
                <button
                  onClick={() => setSellModalOpen(false)}
                  className="text-gray-400 hover:text-white font-bold text-lg hover:cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Quantity */}
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const maxAffordable = Math.floor(
                        (session?.user.wallet ?? 0) / (inrPrice || 1)
                      );
                      setQuantity(
                        val > maxAffordable
                          ? maxAffordable.toString()
                          : val.toString()
                      );
                    }}
                    onKeyDown={handleKeypress}
                    className={`bg-zinc-800/60 border ${
                      Number(quantity || 0) * inrPrice >
                      (session?.user.wallet || 0)
                        ? "border-red-500"
                        : "border-zinc-700"
                    } rounded-md text-white text-center px-3 py-1 w-28 focus:outline-none focus:border-red-500/50`}
                  />
                </div>

                {/* Market Price */}
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Market Price</span>
                  <span className="bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700 w-28 text-center">
                    ₹{Math.round(inrPrice * 100) / 100}
                  </span>
                </div>

                {/* Balance & Required */}
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Total: </span>
                  <span
                    className={`bg-zinc-800/60 px-3 py-1 rounded-md w-28 text-center border ${
                      Number(quantity || 0) * inrPrice >
                      (session?.user.wallet || 0)
                        ? "border-red-500 text-red-500"
                        : "border-zinc-700"
                    }`}
                  >
                    ₹{(Number(quantity || 0) * inrPrice).toFixed(2)}
                  </span>
                </div>

                {message && (
                  <div className="text-red-500 text-center">{message}</div>
                )}
              </div>

              <div className="flex justify-between items-center text-gray-300 text-sm border-t border-zinc-700/80 pt-4 mt-4">
                <span>Balance:</span>
                <span
                  className={`bg-zinc-800/60 px-3 py-1 rounded-md w-28 text-center border border-zinc-700`}
                >
                  ₹{session?.user.wallet}
                </span>
              </div>

              <button
                className="bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 py-3 rounded-md hover:cursor-pointer font-semibold w-full transition"
                disabled={
                  Number(quantity || 0) * inrPrice > (session?.user.wallet || 0)
                }
                onClick={() => handleSell()}
              >
                Short Sell
              </button>
            </div>
          </div>
        )}
      </div>
      <div>{children}</div>
    </>
  );
}
