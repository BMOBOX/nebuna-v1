import { NextRequest, NextResponse } from "next/server";
import {
  fetchTwelveData,
  mapTwelveQuote,
  normalizeQuotePayload,
} from "@/lib/twelvedata";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ stock: string }> }
) {
  const { stock } = await context.params;

  try {
    const { data, error } = await fetchTwelveData<any>("quote", {
      symbol: String(stock).trim().toUpperCase(),
    });

    const raw = normalizeQuotePayload(data)?.[0] ?? null;
    if (!raw) throw new Error(error || "No data found");

    const quote = mapTwelveQuote(raw);
    return NextResponse.json({ regularMarketPrice: quote.regularMarketPrice });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
