// app/api/quotes/[symbol]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(
  req: NextRequest,
  context: { params: { stock: string } }
) {
  const { stock } = await context.params;
  const yf = new yahooFinance();
  try {
    const quote = await yf.quote(stock);

    if (!quote) {
      return NextResponse.json(
        { error: "Regular market price not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while fetching the quote." },
      { status: 500 }
    );
  }
}
