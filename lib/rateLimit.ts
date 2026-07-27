import { NextRequest, NextResponse } from 'next/server';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting by IP / User ID
const rateLimitStore = new Map<string, RateLimitTracker>();

// Cleanup stale rate limit records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of rateLimitStore.entries()) {
      if (tracker.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit?: number; // Maximum allowed requests
  windowMs?: number; // Time window in milliseconds
  identifier?: string; // Custom identifier (e.g. user ID or IP)
}

/**
 * Evaluates rate limit for a request.
 * Returns { isLimited: boolean, current: number, limit: number, remaining: number, resetInSeconds: number }
 */
export function checkRateLimit(req: NextRequest, options: RateLimitOptions = {}) {
  const limit = options.limit || 60; // Default 60 requests
  const windowMs = options.windowMs || 60 * 1000; // Default 1 minute window

  // Determine client identifier: IP or passed identifier
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const clientKey = options.identifier ? `${options.identifier}` : ip;
  const storeKey = `${req.nextUrl.pathname}:${clientKey}`;

  const now = Date.now();
  let tracker = rateLimitStore.get(storeKey);

  if (!tracker || tracker.resetAt <= now) {
    tracker = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(storeKey, tracker);
  } else {
    tracker.count += 1;
  }

  const remaining = Math.max(0, limit - tracker.count);
  const isLimited = tracker.count > limit;
  const resetInSeconds = Math.ceil((tracker.resetAt - now) / 1000);

  return {
    isLimited,
    current: tracker.count,
    limit,
    remaining,
    resetInSeconds,
  };
}

/**
 * Middleware utility to enforce rate limit on an API route.
 * Returns a 429 response if limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(req: NextRequest, options: RateLimitOptions = {}) {
  const result = checkRateLimit(req, options);

  if (result.isLimited) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down and try again shortly.',
        retryAfterSeconds: result.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.resetInSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null;
}
