// app/api/close/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const {
      userId,
      symbol,
      stock_name,
      quantity,
      price, // buy/open price
      close_price, // current market price
      type, // "BUY" or "SELL"
    } = await req.json();

    if (
      !userId ||
      !symbol ||
      !stock_name ||
      !quantity ||
      !price ||
      !close_price ||
      !type
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const qty = Number(quantity);
    const openPrice = Number(price);
    const marketPrice = Number(close_price);

    const { data: deletedRows, error: deleteError } = await supabase
      .from("stocks")
      .delete()
      .eq("user_id", userId)
      .eq("stock_name", symbol);

    console.log("Deleted rows:", deletedRows);

    // 1️⃣ Fetch current wallet
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wallet")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let newWallet = Number(userData.wallet);
    let PL = 0;

    if (type === "BUY") {
      PL = (marketPrice - openPrice) * qty;
      newWallet += marketPrice * qty; // sell proceeds
    } else if (type === "SELL") {
      PL = (openPrice - marketPrice) * qty;
      newWallet += openPrice * qty; // buy-to-cover proceeds
    }

    // 2️⃣ Update wallet
    const { error: walletError } = await supabase
      .from("users")
      .update({ wallet: newWallet })
      .eq("id", userId);

    if (walletError) {
      console.error(walletError);
      return NextResponse.json(
        { error: "Failed to update wallet" },
        { status: 500 }
      );
    }

    // 3️⃣ Insert closing transaction
    const { error: txError } = await supabase.from("transactions").insert([
      {
        user_id: userId,
        symbol: symbol,
        stock_name: stock_name,
        type: type, // closing opposite
        open_price: openPrice,
        close_price: marketPrice,
        quantity: Math.abs(qty),
        total: Math.abs(qty * marketPrice),
        PL: PL,
      },
    ]);

    if (txError) {
      console.error(txError);
      return NextResponse.json(
        { error: "Failed to insert transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Position closed successfully",
      remainingWallet: newWallet,
      PL,
    });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
