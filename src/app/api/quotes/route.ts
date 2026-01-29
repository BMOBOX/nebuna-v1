// app/api/quotes/multi/route.ts
import { NextResponse } from "next/server";
import {
  fetchTwelveData,
  mapTwelveQuote,
  normalizeQuotePayload,
} from "@/lib/twelvedata";

const cache = new Map<
  string,
  { expiresAt: number; data: Array<{ symbol: string; quote?: unknown; error?: unknown }> }
>();
const cacheTtlMs = 15000;

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: "symbols must be a non-empty array" },
        { status: 400 }
      );
    }

    const normalizedSymbols = symbols
      .map((symbol) => String(symbol).trim().toUpperCase())
      .filter(Boolean);

    const cacheKey = normalizedSymbols.join(",");
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ data: cached.data });
    }

    const { data, error } = await fetchTwelveData<any>("quote", {
      symbol: normalizedSymbols.join(","),
    });

    const items = normalizeQuotePayload(data);
    const mapped = new Map(
      items.map((item: any) => [String(item.symbol || "").toUpperCase(), item])
    );

    const results = normalizedSymbols.map((symbol) => {
      const raw = mapped.get(symbol);
      if (!raw) {
        return {
          symbol,
          error: error || "Quote not found",
        };
      }

      return {
        symbol,
        quote: mapTwelveQuote(raw),
      };
    });
    cache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, data: results });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Multi quote API error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}
