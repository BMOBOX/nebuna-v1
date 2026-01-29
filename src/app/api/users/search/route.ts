import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET: Search users by email or name
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    // Search users by email or user_name
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, user_name, wallet")
      .or(`email.ilike.%${query}%,user_name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json(
        { error: "Error searching users" },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error("User search API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
