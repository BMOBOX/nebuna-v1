import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, symbol, quantity, price } = await req.json();

    if (!userId || !symbol || !quantity || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Get current user wallet
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wallet")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error(userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalCost = Number(quantity) * Number(price);

    // 2️⃣ Check if user has enough balance
    if (userData.wallet < totalCost) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 3️⃣ Deduct wallet
    const { error: walletError } = await supabase
      .from("users")
      .update({ wallet: userData.wallet - totalCost })
      .eq("id", userId);

    if (walletError) {
      console.error(walletError);
      return NextResponse.json(
        { error: "Failed to update wallet" },
        { status: 500 }
      );
    }

    // 4️⃣ Add stock to user's portfolio (BUY)
    const { error: orderError } = await supabase.from("stocks").insert([
      {
        user_id: userId,
        stock_name: symbol,
        quantity,
        stock_price: price,
        type: "BUY", // changed from SELL → BUY
      },
    ]);

    if (orderError) {
      console.error(orderError);
      // rollback wallet update if needed
      await supabase
        .from("users")
        .update({ wallet: userData.wallet })
        .eq("id", userId);
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${quantity} shares of ${symbol} purchased`,
      remainingWallet: userData.wallet - totalCost,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
