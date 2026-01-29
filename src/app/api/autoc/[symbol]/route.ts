import { NextResponse } from "next/server";
import { fetchTwelveData } from "@/lib/twelvedata";

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await context.params;

    const { data, error, status } = await fetchTwelveData<{ data: unknown[] }>(
      "symbol_search",
      { symbol: String(symbol).trim() }
    );

    if (!data) {
      return NextResponse.json(
        { error: error || "No data found" },
        { status: status || 404 }
      );
    }

    return NextResponse.json({ quotes: data.data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("TwelveData Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch quote", details: error?.message },
      { status: 500 }
    );
  }
}
