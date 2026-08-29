import "server-only"

/**
 * Fixed-window limiter for the login endpoint.
 *
 * State lives in module memory, which is enough for a single-instance deploy
 * and keeps the app free of a Redis dependency. On a multi-instance host each
 * instance would count separately — noted as a limitation in the README.
 */

const MAX_ATTEMPTS = 5
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes

type Attempt = {
  count: number
  /** Epoch ms when the window opened; the block lifts at start + WINDOW_MS. */
  windowStart: number
}

const attempts = new Map<string, Attempt>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  /** Epoch ms when the window resets — sent to the client for its countdown. */
  resetAt: number
}

/** Checks the limit without consuming an attempt. */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: now + WINDOW_MS }
  }

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    resetAt: entry.windowStart + WINDOW_MS,
  }
}

/** Records one failed attempt and returns the state after it. */
export function recordFailure(key: string): RateLimitResult {
  const now = Date.now()
  const entry = attempts.get(key)

  // A fresh window either because none existed or the previous one expired.
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      resetAt: now + WINDOW_MS,
    }
  }

  entry.count += 1

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    resetAt: entry.windowStart + WINDOW_MS,
  }
}

/** Clears the counter after a successful sign-in. */
export function clearRateLimit(key: string) {
  attempts.delete(key)
}

/**
 * Best-effort client identity. Behind a proxy the socket address is the
 * proxy's, so the forwarded header is preferred when present.
 */
export function clientKey(request: Request): string {
  // Only trust forwarded chains when explicitly deployed behind a trusted
  // proxy/CDN that normalizes them.
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0].trim()
  }

  return request.headers.get("x-real-ip") ?? "unknown"
}
