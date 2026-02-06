/**
 * In-memory rate limiting using a Map-based sliding window approach.
 * Suitable for single-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Don't block process exit
  cleanupTimer.unref?.();
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in the window */
  current: number;
  /** Maximum allowed requests */
  limit: number;
  /** Milliseconds until the window resets */
  resetIn: number;
}

/**
 * Check rate limit for a given identifier.
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetAt < now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      current: 1,
      limit: config.limit,
      resetIn: config.windowMs,
    };
  }

  // Increment counter
  entry.count++;

  const result: RateLimitResult = {
    allowed: entry.count <= config.limit,
    current: entry.count,
    limit: config.limit,
    resetIn: entry.resetAt - now,
  };

  return result;
}

/**
 * Get client identifier from request (IP address).
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  validateToken: { limit: 20, windowMs: 60 * 1000 },  // 20 req/min
  checkout: { limit: 10, windowMs: 60 * 1000 },       // 10 req/min
  admin: { limit: 100, windowMs: 60 * 1000 },         // 100 req/min
} as const;

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.limit - result.current).toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  };
}
