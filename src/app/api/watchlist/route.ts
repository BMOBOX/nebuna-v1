import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id, symbol, action } = await req.json();

    if (!id || !symbol || !action) {
      return NextResponse.json(
        { error: "Missing id, symbol or action" },
        { status: 400 }
      );
    }

    // ------------------------
    // ADD TO WATCHLIST
    // ------------------------
    if (action === "add") {
      const { error } = await supabase
        .from("watchlist")
        .insert([{ user_id: id, symbol }]);

      if (error) {
        console.error("Error adding:", error);
        return NextResponse.json(
          { error: "Error adding to watchlist" },
          { status: 500 }
        );
      }
    }

    // ------------------------
    // REMOVE FROM WATCHLIST
    // ------------------------
    if (action === "remove") {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", id)
        .eq("symbol", symbol);

      if (error) {
        console.error("Error removing:", error);
        return NextResponse.json(
          { error: "Error removing from watchlist" },
          { status: 500 }
        );
      }
    }

    // ------------------------
    // RETURN UPDATED WATCHLIST
    // ------------------------
    const { data: updatedList, error: fetchError } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", id);

    if (fetchError) {
      console.error(fetchError);
      return NextResponse.json(
        { error: "Could not fetch updated watchlist" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedList);
  } catch (err) {
    console.error("Watchlist API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
