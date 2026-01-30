import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import type { PortfolioContext } from "@/types/chat";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.user_id);

    // Get user's wallet
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's stocks (using stocks table)
    const { data: stocks, error: stocksError } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId);

    if (stocksError) {
      return NextResponse.json(
        { error: "Failed to fetch stocks" },
        { status: 500 }
      );
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (transactionsError) {
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Calculate portfolio metrics
    let totalInvested = 0;
    let totalValue = 0;

    const holdingsWithMetrics = (stocks || []).map((stock) => {
      const invested = stock.quantity * stock.stock_price;
      const currentValue = stock.quantity * stock.stock_price;

      totalInvested += invested;
      totalValue += currentValue;

      return {
        symbol: stock.stock_name,
        quantity: stock.quantity,
        buy_price: stock.stock_price,
        total_value: currentValue,
      };
    });

    // Build portfolio context
    const context: PortfolioContext = {
      wallet: user.wallet,
      holdings: holdingsWithMetrics,
      transactions: (transactions || []).map((tx) => ({
        id: tx.id,
        symbol: tx.stock_name,
        type: tx.type,
        quantity: tx.quantity,
        price: tx.open_price,
        total: tx.quantity * tx.open_price,
        close_price: tx.close_price,
        pl: tx.PL,
        created_at: tx.created_at,
      })),
      total_invested: totalInvested,
      total_value: totalValue,
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error("Error fetching portfolio context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
