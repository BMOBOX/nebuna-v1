import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> }
) {
  const yf = new yahooFinance();
  try {
    const { symbol } = await context.params;

    // Search or fetch quote
    const data = await yf.search(symbol);

    if (!data) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("YahooFinance Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch quote", details: error?.message },
      { status: 500 }
    );
  }
}
