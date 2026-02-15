/**
 * Simple in-memory sliding window rate limiter
 */
import type { Context, Next } from 'hono';

interface RateLimitOptions {
  windowMs: number;   // Time window in ms
  max: number;        // Max requests per window
  keyFn?: (c: Context) => string;  // Extract key (default: IP)
  message?: string;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, WindowEntry>>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(opts: RateLimitOptions) {
  const storeId = `${opts.windowMs}-${opts.max}-${Math.random()}`;
  const store = new Map<string, WindowEntry>();
  stores.set(storeId, store);

  const keyFn = opts.keyFn || ((c: Context) =>
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('cf-connecting-ip') ||
    'unknown'
  );

  return async (c: Context, next: Next) => {
    const key = keyFn(c);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, entry);
    }

    entry.count++;

    c.header('X-RateLimit-Limit', String(opts.max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, opts.max - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > opts.max) {
      return c.json(
        { error: opts.message || 'Too many requests', retry_after: Math.ceil((entry.resetAt - now) / 1000) },
        429
      );
    }

    await next();
  };
}
