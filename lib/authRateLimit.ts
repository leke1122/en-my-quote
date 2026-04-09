type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/**
 * Simple in-memory rate limit (best-effort on serverless) to reduce brute force.
 */
export function rateLimitCheck(
  key: string,
  opts: { max: number; windowMs: number }
): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const hit = store.get(key);
  if (!hit || now >= hit.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: Math.max(0, opts.max - 1) };
  }
  if (hit.count >= opts.max) {
    const retryAfterSec = Math.max(1, Math.ceil((hit.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  hit.count += 1;
  store.set(key, hit);
  return { ok: true, remaining: Math.max(0, opts.max - hit.count) };
}

export function requestIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  const real = request.headers.get("x-real-ip") || "";
  const ip = xff.split(",")[0]?.trim() || real.trim() || "unknown";
  return ip;
}

