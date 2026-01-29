import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET: Fetch global leaderboard (top wallet users)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, user_name, wallet")
      .order("wallet", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json(
        { error: "Error fetching leaderboard" },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error("Leaderboard API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
