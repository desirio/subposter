interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Periodic cleanup every 60s to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000)
  }

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
    }

    entry.count++

    if (entry.count > limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
  }

  private cleanup() {
    const now = Date.now()
    this.store.forEach((entry, key) => {
      if (now >= entry.resetAt) {
        this.store.delete(key)
      }
    })
  }
}

// Pre-configured instances
export const authLimiter = new RateLimiter()   // 15-min window, used with specific limits per route
export const apiLimiter = new RateLimiter()    // 1-min window, used with specific limits per route

// Window constants (ms)
export const AUTH_WINDOW = 15 * 60 * 1000  // 15 minutes
export const API_WINDOW = 60 * 1000         // 1 minute
