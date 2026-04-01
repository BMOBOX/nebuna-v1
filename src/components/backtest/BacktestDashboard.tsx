"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, UTCTimestamp, LineSeries } from "lightweight-charts";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPercent: number;
}

interface DailyEquity {
  date: string;
  equity: number;
  close: number;
}

interface Metrics {
  initialCapital: number;
  finalEquity: number;
  totalReturn: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
}

interface BacktestDashboardProps {
  metrics: Metrics;
  chartData: DailyEquity[];
  trades: Trade[];
}

export default function BacktestDashboard({ metrics, chartData, trades }: BacktestDashboardProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#334155", visible: false },
        horzLines: { color: "#334155", visible: false },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { 
        borderColor: "#334155",
        autoScale: true,
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      autoSize: true, // Use built-in autoSize for lightweight-charts
    });

    chartRef.current = chart;

    const actualSeries = chart.addSeries(LineSeries, {
      color: "#10b981", // Emerald 500
      lineWidth: 2,
      title: "Portfolio Equity",
      crosshairMarkerVisible: true,
      lastValueVisible: true,
    });
    
    equitySeriesRef.current = actualSeries;

    const formattedData: LineData<UTCTimestamp>[] = chartData.map((d) => ({
      time: Math.floor(new Date(d.date).getTime() / 1000) as UTCTimestamp,
      value: d.equity,
    }));

    actualSeries.setData(formattedData);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [chartData]);

  const isProfitable = metrics.totalReturn >= 0;

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Return */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {isProfitable ? <TrendingUp size={48} className="text-emerald-500" /> : <TrendingDown size={48} className="text-red-500" />}
          </div>
          <p className="text-sm text-zinc-400 font-medium mb-1">Total Return</p>
          <h3 className={`text-3xl font-bold truncate ${isProfitable ? "text-emerald-400" : "text-red-400"}`}>
            {metrics.totalReturn > 0 ? "+" : ""}{metrics.totalReturn.toFixed(2)}%
          </h3>
          <p className="text-xs text-zinc-500 mt-2">
            Final Equity: ${metrics.finalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Win Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target size={48} className="text-blue-500" />
          </div>
          <p className="text-sm text-zinc-400 font-medium mb-1">Win Rate</p>
          <h3 className="text-3xl font-bold text-zinc-100 truncate">
            {metrics.winRate.toFixed(1)}%
          </h3>
          <p className="text-xs text-zinc-500 mt-2">
            {metrics.totalTrades} Total Trades
          </p>
        </motion.div>

        {/* Max Drawdown */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={48} className="text-rose-500" />
          </div>
          <p className="text-sm text-zinc-400 font-medium mb-1">Max Drawdown</p>
          <h3 className="text-3xl font-bold text-rose-400 truncate">
            {metrics.maxDrawdown.toFixed(2)}%
          </h3>
          <p className="text-xs text-zinc-500 mt-2">
            Highest peak-to-trough drop
          </p>
        </motion.div>
      </div>

      {/* Equity Curve Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl"
      >
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-200">Equity Curve</h2>
          <span className="text-xs text-zinc-500 px-2 py-1 bg-zinc-800 rounded-md">1D Candles</span>
        </div>
        <div ref={chartContainerRef} className="w-full h-[400px] mt-2 rounded-b-lg overflow-hidden" />
      </motion.div>
    </div>
  );
}
