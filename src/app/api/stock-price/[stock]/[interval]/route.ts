// app/api/stock-price/[stock]/[interval]/route.ts
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ stock: string; interval: string }> } // params is a Promise
) {
  const { stock, interval } = await context.params; // ✅ unwrap the Promise
  const yf = new yahooFinance({ suppressNotices: ["yahooSurvey"] }); // suppress survey message

  try {
    const validIntervals = ["1m", "5m", "15m", "1h", "1d"];
    const yfInterval = validIntervals.includes(interval) ? interval : "1d";

    // period1 as Date object
    let period1 = new Date();
    if (yfInterval === "1m") {
      period1.setDate(period1.getDate() - 5);
    } else if (["5m", "15m", "1h"].includes(yfInterval)) {
      period1.setDate(period1.getDate() - 30);
    } else {
      period1.setFullYear(period1.getFullYear() - 1);
    }

    let result;
    try {
      result = await yf.chart(stock, { period1, interval: yfInterval as any });
    } catch (err) {
      console.error("Yahoo Finance chart error:", err);
      return NextResponse.json(
        {
          quotes: [],
          error: "No data found, symbol may be delisted or invalid",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
