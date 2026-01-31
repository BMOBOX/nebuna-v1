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
      .then(async (d) => {
        setData(d);
        if (d.currency != "INR") {
          const response = await fetch(
            `https://api.exchangerate-api.com/v4/latest/${d.currency}`
          );
          const data = await response.json();
          const rates = data.rates;
          setInrPrice(rates["INR"] * d.regularMarketPrice);
          setPrice(d.regularMarketPrice);
        } else {
          setInrPrice(d.regularMarketPrice);
          setPrice(d.regularMarketPrice);
        }
      });
  }, [stock]);

  useEffect(() => {
    if (watch) {
      setWatchList(!watchlist);
    }
  }, [watch]);

  async function toggleWatchlist() {
    if (!session?.user?.id || !data?.symbol) return;

    if ((watchlist ? "remove" : "add") === "add") {
      toast.success("Added to Watchlist!");
    } else toast.error("Removed from Watchlist!");
    setWatchList(!watchlist);

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

  async function closePosition(): Promise<void> {
    if (!session?.user?.user_id || !data?.symbol || !owned) return;
    toast.success("Position closed!");

    // Remove this stock from orders
    setOrders((prev) => prev.filter((o) => o.stock_name !== data.symbol));
    const own = owned;
    // Reset owned and profit/loss
    setOwned(0);
    setProfitLoss(0);
    try {
      console.log(priceu, inrPrice);
      // Sell all shares
      const resp = await close(
        data.symbol,
        session.user.user_id,
        data.shortName,
        own,
        priceu,
        inrPrice,
        type_
      );

      if (resp.success) {
        session.user.wallet = resp.remainingWallet;
      } else {
        toast.error(resp.error || "Failed to close position");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  const formatPrice = (value: number | null, currency: string | null) => {
    if (!Number.isFinite(value)) return "N/A";
    const safeCurrency = currency && currency !== "" ? currency : "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: safeCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value as number);
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <>
      <div className="flex flex-col bg-zinc-950 min-h-screen text-white">
        {/* Professional Header Bar */}
        <header className="w-full bg-zinc-900 border-b border-zinc-800 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between max-w-[1920px] mx-auto">
            {/* Left: Back + Stock Info */}
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard/portfolio"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">
                  Dashboard
                </span>
              </Link>

              <div className="h-6 w-px bg-zinc-700" />

              {/* Stock Info Compact */}
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {data.shortName}
                  </h1>
                  <p className="text-xs text-zinc-500">{data.symbol}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    ₹{Math.round(inrPrice * 100) / 100}
                  </span>
                  {data.currency != "INR" && (
                    <span className="text-xs text-zinc-500">
                      {formatPrice(
                        Math.round(price * 100) / 100,
                        data.currency
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Search + Wallet */}
            <div className="flex items-center gap-4">
              <div className="w-48 hidden md:block">
                <Search />
              </div>
              <Wallet user={session?.user} />
            </div>
          </div>
        </header>

        {/* Main Content - Full Width Layout */}
        <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
          {/* Chart Section - Takes remaining space */}
          <div className="flex-1 flex flex-col min-h-[60vh] lg:min-h-0 bg-zinc-950">
            {/* Chart Header with Interval */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Interval
                </span>
                <select
                  className="bg-zinc-800 text-white rounded px-3 py-1.5 text-sm border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="1d">1d</option>
                </select>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Vol: {data.regularMarketVolume?.toLocaleString()}</span>
                <span>P/E: {data.trailingPE || "N/A"}</span>
              </div>
            </div>

            {/* Chart - Full height */}
            <div className="flex-1 relative">
              <Chart interval={interval} />
            </div>
          </div>

          {/* Right Sidebar - Fixed width */}
          <aside className="w-full lg:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col max-h-[40vh] lg:max-h-screen overflow-y-auto">
            {/* Trading Panel Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{stock}</h2>
                <button
                  onClick={toggleWatchlist}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    watchlist
                      ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30"
                  }`}
                >
                  {watchlist ? "− Watchlist" : "+ Watchlist"}
                </button>
              </div>
            </div>

            {/* Price Info */}
            <div className="p-4 border-b border-zinc-800">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-white">
                  ₹{Math.round(inrPrice * 100) / 100}
                </span>
                {data.currency != "INR" && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatPrice(Math.round(price * 100) / 100, data.currency)}
                  </p>
                )}
              </div>

              {/* Day Range */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Day High</p>
                  <p className="text-white font-medium">
                    {formatPrice(
                      data.regularMarketDayRange?.high,
                      data.currency
                    )}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Day Low</p>
                  <p className="text-white font-medium">
                    {formatPrice(
                      data.regularMarketDayRange?.low,
                      data.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
            {/* Company Info */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Company Info
              </h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Full Name</span>
                <span className="text-white text-right max-w-[60%] truncate">
                  {data.longName || data.shortName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Exchange</span>
                <span className="text-white">{data.exchange || "N/A"}</span>
              </div>
            </div>

            {/* Key Statistics */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Key Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Market Cap</p>
                  <p className="text-white font-medium text-sm">
                    {data.marketCap
                      ? "₹" + (data.marketCap / 10000000).toFixed(2) + "Cr"
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Volume</p>
                  <p className="text-white font-medium text-sm">
                    {data.regularMarketVolume
                      ? data.regularMarketVolume.toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Market Data
              </h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">52W Range</span>
                <span className="text-white">
                  {data.fiftyTwoWeekLow || "N/A"} -{" "}
                  {data.fiftyTwoWeekHigh || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Analyst Rating</span>
                <span className="text-white font-medium">
                  {data.averageAnalystRating || "N/A"}
                </span>
              </div>
            </div>

            {/* Trading Actions */}
            <div className="p-4 mt-auto">
              {owned ? (
                <div className="space-y-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-zinc-400 text-sm">Position P&L</p>
                    <p
                      className={`text-2xl font-bold ${
                        profitLoss >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {profitLoss >= 0 ? "+" : "-"}₹
                      {Math.abs(profitLoss).toFixed(2)}
                    </p>
                  </div>
                  <button
                    className="w-full bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 rounded-lg py-3 font-semibold transition"
                    onClick={closePosition}
                  >
                    Close Position
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition"
                    onClick={() => setBuyModalOpen(true)}
                  >
                    Buy {stock}
                  </button>
                  <button
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition"
                    onClick={() => setSellModalOpen(true)}
                  >
                    Sell {stock}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </main>

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
                  className={`bg-zinc-800/60 px-3 py-1 rounded-md w-32 text-center border border-zinc-700`}
                >
                  ₹{session?.user.wallet.toFixed(2)}
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
                  className={`bg-zinc-800/60 px-3 py-1 rounded-md w-32 text-center border border-zinc-700`}
                >
                  ₹{session?.user.wallet.toFixed(2)}
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
