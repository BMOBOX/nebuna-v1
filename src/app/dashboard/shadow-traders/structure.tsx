"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import {
  Eye,
  Building2,
  Calendar,
  PieChart,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Holding {
  ticker: string;
  shares: number;
  valueUSD: number;
}

interface Investor {
  investor: string;
  cik: string;
  period: string;
  totalHoldings: number;
  topHoldings: Holding[];
  error?: string;
}

interface ShadowData {
  count: number;
  data: Investor[];
}

// Utility function to format large numbers
function formatNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatShares(shares: number): string {
  if (shares >= 1e9) {
    return `${(shares / 1e9).toFixed(2)}B`;
  } else if (shares >= 1e6) {
    return `${(shares / 1e6).toFixed(2)}M`;
  } else if (shares >= 1e3) {
    return `${(shares / 1e3).toFixed(2)}K`;
  }
  return shares.toLocaleString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Get gradient colors based on investor index
function getCardGradient(index: number): string {
  const gradients = [
    "from-amber-500/10 via-orange-500/5 to-zinc-900/50",
    "from-blue-500/10 via-cyan-500/5 to-zinc-900/50",
    "from-emerald-500/10 via-teal-500/5 to-zinc-900/50",
    "from-purple-500/10 via-violet-500/5 to-zinc-900/50",
    "from-rose-500/10 via-pink-500/5 to-zinc-900/50",
    "from-indigo-500/10 via-blue-500/5 to-zinc-900/50",
    "from-cyan-500/10 via-sky-500/5 to-zinc-900/50",
    "from-fuchsia-500/10 via-purple-500/5 to-zinc-900/50",
    "from-lime-500/10 via-green-500/5 to-zinc-900/50",
    "from-red-500/10 via-orange-500/5 to-zinc-900/50",
  ];
  return gradients[index % gradients.length];
}

// Get border color based on investor index
function getBorderColor(index: number): string {
  const colors = [
    "group-hover:border-amber-500/30",
    "group-hover:border-blue-500/30",
    "group-hover:border-emerald-500/30",
    "group-hover:border-purple-500/30",
    "group-hover:border-rose-500/30",
    "group-hover:border-indigo-500/30",
    "group-hover:border-cyan-500/30",
    "group-hover:border-fuchsia-500/30",
    "group-hover:border-lime-500/30",
    "group-hover:border-red-500/30",
  ];
  return colors[index % colors.length];
}

// Investor Card Component
function InvestorCard({
  investor,
  index,
}: {
  investor: Investor;
  index: number;
}) {
  const totalValue = investor.topHoldings.reduce(
    (sum, h) => sum + h.valueUSD,
    0
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br p-6 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl",
        getCardGradient(index),
        getBorderColor(index)
      )}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {investor.investor}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(investor.period)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/60 px-3 py-1 text-xs text-zinc-300">
            <PieChart className="h-3 w-3" />
            <span>{investor.totalHoldings} holdings</span>
          </div>
        </div>

        {/* Top Holdings Table */}
        <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 text-xs text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">Ticker</th>
                <th className="px-3 py-2 text-right font-medium">Shares</th>
                <th className="px-3 py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {investor.topHoldings.map((holding, idx) => {
                const percentage =
                  totalValue > 0 ? (holding.valueUSD / totalValue) * 100 : 0;
                return (
                  <tr
                    key={`${investor.cik}-${holding.ticker}-${idx}`}
                    className="border-b border-zinc-800/30 transition-colors hover:bg-zinc-800/20 last:border-0"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {holding.ticker}
                        </span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-400">
                      {formatShares(holding.shares)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-medium text-emerald-400">
                        {formatNumber(holding.valueUSD)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <TrendingUp className="h-3 w-3" />
            <span>Top 5 Holdings</span>
          </div>
          <div className="text-xs text-zinc-500">
            CIK: <span className="text-zinc-400">{investor.cik}</span>
          </div>
        </div>
      </div>

      {/* Decorative glow effect */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl transition-all duration-500 group-hover:bg-white/10" />
    </div>
  );
}

// Loading Skeleton Component
function InvestorCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-zinc-800" />
            <div>
              <div className="mb-2 h-5 w-32 rounded bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-zinc-800" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-zinc-800" />
        </div>

        {/* Table Skeleton */}
        <div className="mb-4 rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="mb-2 flex items-center justify-between last:mb-0"
            >
              <div className="h-4 w-16 rounded bg-zinc-800" />
              <div className="h-4 w-20 rounded bg-zinc-800" />
              <div className="h-4 w-24 rounded bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
          <div className="h-3 w-24 rounded bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

// Error Component
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-red-200">
        Failed to Load Data
      </h3>
      <p className="max-w-md text-sm text-red-300/70">{message}</p>
    </div>
  );
}

// Header Component
function Header() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Shadow Traders</h1>
          <p className="text-sm text-zinc-400">Track Institutional Investors</p>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-zinc-500">
        Monitor the latest 13F filings from top institutional investors. Get
        insights into their portfolio allocations and top holdings.
      </p>
    </div>
  );
}

// Main Structure Component
export function Structure({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: Session["user"];
}) {
  const [data, setData] = useState<ShadowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShadowData() {
      try {
        const response = await fetch("/api/shadow-static");
        if (!response.ok) {
          throw new Error("Failed to fetch shadow trading data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchShadowData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <InvestorCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : data ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.data.map((investor, index) => (
              <InvestorCard
                key={investor.cik}
                investor={investor}
                index={index}
              />
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
