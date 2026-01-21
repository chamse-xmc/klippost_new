/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting (e.g., @upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowSec * 1000,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowSec,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Get client identifier from request (IP or user ID)
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers (works behind proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  return `ip:${ip}`;
}

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  // Expensive AI operations - strict limit
  analysis: { limit: 10, windowSec: 60 }, // 10 per minute

  // File uploads
  upload: { limit: 20, windowSec: 60 }, // 20 per minute

  // Review submissions - prevent bonus farming
  review: { limit: 3, windowSec: 3600 }, // 3 per hour

  // General API calls
  api: { limit: 60, windowSec: 60 }, // 60 per minute

  // Auth attempts
  auth: { limit: 10, windowSec: 300 }, // 10 per 5 minutes

  // Affiliate operations
  affiliate: { limit: 10, windowSec: 60 }, // 10 per minute
} as const;
