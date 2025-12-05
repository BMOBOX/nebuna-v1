// lib/createUserIfNotExists.ts ← FINAL FIXED VERSION
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function createUserIfNotExists(
  userId: string,
  email: string,
  username?: string
) {
  // Check if row already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  // INSERT WITH CORRECT TYPES
  const { error } = await supabaseAdmin.from("users").insert({
    email: email,
    user_name: username || email.split("@")[0],
    wallet: 100000, // ← number, NOT string
    // DO NOT pass anything else here
  });

  if (error) {
    console.error("Failed to insert into public.users:", error);
    throw error;
  }
}
