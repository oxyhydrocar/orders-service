import { Request, Response, NextFunction } from "express";

const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const CAPACITY = 20;
const REFILL_PER_MS = CAPACITY / 60_000; // 20 per minute

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-user-id") || req.ip || "anon";
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: CAPACITY, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + elapsed * REFILL_PER_MS);
  bucket.lastRefill = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return res.status(429).json({ error: "rate limit exceeded" });
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  next();
}
