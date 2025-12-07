// lib/createUserIfNotExists.ts ← FINAL FIXED VERSION
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function createUserIfNotExists(email: string, fullName?: string) {
  try {
    // check if user exists first
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // create user if not exists
      const { error: insertError } = await supabaseAdmin.from("users").insert({
        user_name: fullName,
        email: email,
        wallet: 100000,
      });

      if (insertError) throw insertError;
    }

    return true;
  } catch (err) {
    console.error("createUserIfNotExists error:", err);
    return false;
  }
}
