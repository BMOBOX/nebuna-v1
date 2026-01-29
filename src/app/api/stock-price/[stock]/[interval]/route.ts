// app/api/stock-price/[stock]/[interval]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchTwelveData } from "@/lib/twelvedata";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ stock: string; interval: string }> } // params is a Promise
) {
  const { stock, interval } = await context.params; // ✅ unwrap the Promise

  try {
    const intervalMap: Record<string, string> = {
      "1m": "1min",
      "5m": "5min",
      "15m": "15min",
      "1h": "1h",
      "1d": "1day",
    };
    const yfInterval = intervalMap[interval] || "1day";

    const outputsize = ["1min", "5min", "15min", "1h"].includes(yfInterval)
      ? "5000"
      : "365";

    const { data, error, status } = await fetchTwelveData<{ values: any[] }>(
      "time_series",
      {
        symbol: String(stock).trim().toUpperCase(),
        interval: yfInterval,
        outputsize,
      }
    );

    if (!data?.values || !Array.isArray(data.values)) {
      return NextResponse.json(
        {
          quotes: [],
          error: error || "No data found, symbol may be delisted or invalid",
        },
        { status: status || 404 }
      );
    }

    const quotes = data.values
      .map((item) => ({
        date: item.datetime,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }))
      .filter((item) =>
        [item.open, item.high, item.low, item.close].every((value) =>
          Number.isFinite(value)
        )
      )
      .reverse();

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
