import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(
  req: NextRequest,
  context: { params: { stock: string } }
) {
  const { stock } = await context.params;
  const yf = new yahooFinance();

  try {
    const quote = await yf.quote(stock);
    if (!quote) throw new Error("No data found");
    return NextResponse.json(quote);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
