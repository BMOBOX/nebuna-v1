"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getwatchStocks, removestock } from "@/services/stock";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import getSymbolFromCurrency from "currency-symbol-map";
import { Converter } from "easy-currencies";
import { getSession } from "next-auth/react";
import { Session } from "next-auth";
import Watchlist from "@/components/Watchlist";

interface WatchItem {
  id?: string;
  symbol: string;
  longName: string;
  regularMarketPrice: number;
  currency: string;
  regularMarketChangePercent: number;
  averageAnalystRating?: string;
  regularMarketVolume: number;
  created_at?: string;
}

export function Structure({
  children,
  watchlist,
  user,
}: {
  children: React.ReactNode;
  watchlist?: any[];
  user?: Session["user"];
}) {
  return (
    <>
      <div className="shadcn dark">
        <Watchlist data={watchlist} user={user} />
      </div>
      <div>{children}</div>
    </>
  );
}
