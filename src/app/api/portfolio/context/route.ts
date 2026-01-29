import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import type { PortfolioContext } from "@/types/chat";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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

    // Get user's holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId);

    if (holdingsError) {
      return NextResponse.json(
        { error: "Failed to fetch holdings" },
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
    let totalPnL = 0;

    const holdingsWithMetrics = (holdings || []).map((holding) => {
      const invested = holding.quantity * holding.avg_price;
      const currentValue = holding.quantity * holding.current_price;
      const pnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

      totalInvested += invested;
      totalValue += currentValue;
      totalPnL += pnl;

      return {
        symbol: holding.stock_name,
        quantity: holding.quantity,
        avg_price: holding.stock_price,
        current_price: holding.current_price,
        total_value: currentValue,
        unrealized_pnl: pnl,
        unrealized_pnl_percent: pnlPercent,
      };
    });

    const totalPnLPercent =
      totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Build portfolio context
    const context: PortfolioContext = {
      wallet: user.wallet,
      holdings: holdingsWithMetrics,
      transactions: (transactions || []).map((tx) => ({
        id: tx.id,
        symbol: tx.symbol,
        type: tx.type,
        quantity: tx.quantity,
        price: tx.price,
        total: tx.total,
        created_at: tx.created_at,
      })),
      total_invested: totalInvested,
      total_value: totalValue,
      total_pnl: totalPnL,
      total_pnl_percent: totalPnLPercent,
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
