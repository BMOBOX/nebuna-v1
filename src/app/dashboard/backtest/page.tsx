"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StarsBackground from "@/components/StarsBackground";
import { motion } from "motion/react";
import BacktestDashboard from "@/components/backtest/BacktestDashboard";
import { Loader2, Settings, Play } from "lucide-react";
import { toast } from "react-toastify";

const TICKERS = [
  "SPY", "QQQ", "IWM", 
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
  "JPM", "V", "JNJ", "WMT", 
  "BTC-USD", "ETH-USD"
];

export default function BacktestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [formData, setFormData] = useState({
    ticker: "SPY",
    startDate: "2020-01-01",
    endDate: new Date().toISOString().split("T")[0],
    shortSma: 50,
    longSma: 200,
    initialCapital: 10000,
  });

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to backtest.");
      }

      setResults(data);
    } catch (err: any) {
      toast.error(err.message, { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-16 relative z-10">
        
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 relative">
              Strategy Studio
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Backtest algorithmic trading logic instantly against deep historical offline data. Test parameters, gauge performance, and iterate.
            </p>
          </div>
          <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
               Engine Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Controls Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl h-fit sticky top-24"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
              <Settings className="text-zinc-400" size={20} />
              <h2 className="text-lg font-bold text-zinc-100">Parameters</h2>
            </div>

            <form onSubmit={handleRunBacktest} className="space-y-5">
              
              {/* Asset Focus */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Target Asset</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={formData.ticker}
                  onChange={(e) => setFormData({...formData, ticker: e.target.value})}
                >
                  {TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Time Horizon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-zinc-200 focus:border-blue-500 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-zinc-200 focus:border-blue-500 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>

              {/* Signals */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Trading Signals (SMA Cross)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Fast SMA</label>
                    <input 
                      type="number" 
                      value={formData.shortSma}
                      onChange={(e) => setFormData({...formData, shortSma: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Slow SMA</label>
                    <input 
                      type="number" 
                      value={formData.longSma}
                      onChange={(e) => setFormData({...formData, longSma: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 transition-all text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Capital */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">Simulation</label>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Starting Capital ($)</label>
                  <input 
                    type="number" 
                    value={formData.initialCapital}
                    onChange={(e) => setFormData({...formData, initialCapital: parseInt(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 transition-all text-left"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Running Engine...
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      Run Backtest
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Visualization Area */}
          <div className="xl:col-span-3 min-h-[600px] flex flex-col">
            {!results && !loading && (
              <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/30">
                <Play size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium text-zinc-400">Configure parameters & Execute</p>
                <p className="text-sm">Historical simulations run locally zero-latency.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center bg-zinc-900/30">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                  <Loader2 size={48} className="text-blue-500 animate-spin relative z-10" />
                </div>
                <p className="mt-4 text-zinc-400 font-medium tracking-wide">Crunching historical vectors...</p>
              </div>
            )}

            {results && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 mb-4 flex items-center justify-between shadow-inner">
                   <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-lg font-bold text-white uppercase tracking-widest">{formData.ticker}</span>
                     <span className="text-sm text-zinc-400 font-medium">SMA {formData.shortSma} <span className="text-zinc-600 mx-1">/</span> {formData.longSma} Strategy</span>
                   </div>
                   <div className="text-xs font-semibold text-zinc-500 uppercase">
                     {new Date(formData.startDate).toLocaleDateString()} — {new Date(formData.endDate).toLocaleDateString()}
                   </div>
                </div>
                
                <BacktestDashboard 
                  metrics={results.metrics} 
                  chartData={results.chartData} 
                  trades={results.trades} 
                />
              </motion.div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
