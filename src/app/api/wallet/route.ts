import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch wallet balance from Supabase
    const { data, error } = await supabase
      .from("users") // assuming wallet is in users table
      .select("wallet")
      .eq("id", userId)
      .single(); // fetch a single row

    if (error) {
      console.error("Wallet fetch error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ wallet: data?.wallet ?? 0 });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
