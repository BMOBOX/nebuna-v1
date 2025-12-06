import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, symbol } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId)
      .eq("stock_name", symbol);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
