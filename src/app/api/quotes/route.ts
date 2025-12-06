// app/api/quotes/multi/route.ts
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: "symbols must be a non-empty array" },
        { status: 400 }
      );
    }

    const yf = new yahooFinance();

    // Fetch all quotes in parallel
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yf.quote(symbol);
          return { symbol, quote };
        } catch (err) {
          return { symbol, error: "Failed to fetch" };
        }
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Multi quote API error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}
