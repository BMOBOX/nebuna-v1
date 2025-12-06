import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.NEXT_PUBLIC_REDIS_HOST!,
  port: Number(process.env.NEXT_PUBLIC_REDIS_PORT || 6379),
  password: process.env.NEXT_PUBLIC_REDIS_PASSWORD || undefined,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("[ioredis] error:", err));
