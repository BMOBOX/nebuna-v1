import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { redis } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Create user in Supabase admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm for signup
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 400 }
      );
    }

    const user = data.user;

    // Create Redis session manually
    const sid = uuidv4();
    const ttl = 60 * 60 * 24; // 24h

    const payload = {
      userId: user.id,
      email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + ttl,
    };

    await redis.setex(`session:${sid}`, ttl, JSON.stringify(payload));
    await redis.sadd(`user_sessions:${user.id}`, sid);

    return NextResponse.json({
      success: true,
      sid,
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
