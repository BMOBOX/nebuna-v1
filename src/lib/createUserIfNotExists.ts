// lib/createUserIfNotExists.ts ← FINAL FIXED VERSION
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function createUserIfNotExists(
  userId: string,
  email: string,
  fullName?: string
) {
  try {
    // check if user exists first
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // create user if not exists
      const { error: insertError } = await supabaseAdmin.from("users").insert({
        id: userId,
        email,
        full_name: fullName,
        wallet: 0,
      });

      if (insertError) throw insertError;
    }

    return true;
  } catch (err) {
    console.error("createUserIfNotExists error:", err);
    return false;
  }
}
