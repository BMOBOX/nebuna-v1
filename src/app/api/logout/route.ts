import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token || !token.sid) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // Delete Redis session
  await redis.del(`session:${token.sid}`);
  await redis.srem(`user_sessions:${token.id}`, token.sid);

  // Clear cookies
  const res = NextResponse.json({ success: true });

  res.cookies.set("next-auth.session-token", "", { maxAge: 0 });
  res.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0 });

  return res;
}
