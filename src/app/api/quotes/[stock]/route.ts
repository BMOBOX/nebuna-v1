// app/api/quotes/[symbol]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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
    const { data, error, status } = await fetchTwelveData<any>("quote", {
      symbol: String(stock).trim().toUpperCase(),
    });

    const raw = normalizeQuotePayload(data)?.[0] ?? null;

    if (!raw) {
      return NextResponse.json(
        { error: error || "Regular market price not found" },
        { status: status || 404 }
      );
    }

    return NextResponse.json(mapTwelveQuote(raw));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while fetching the quote." },
      { status: 500 }
    );
  }
}
