import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "User ID not provided" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", id);

    if (error) {
      console.error("Error fetching stocks:", error);
      return NextResponse.json(
        { error: "Error fetching stocks" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
