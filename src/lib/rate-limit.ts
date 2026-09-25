import "server-only"
import { headers } from "next/headers"

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory sliding window cache
const rateLimitStore = new Map<string, RateLimitRecord>()

// Periodically clean up expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Extracts client IP from request headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const reqHeaders = await headers()
    const forwardedFor = reqHeaders.get("x-forwarded-for")
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0]?.trim()
      if (firstIp) return firstIp
    }

    const realIp = reqHeaders.get("x-real-ip")
    if (realIp) return realIp.trim()

    const cfIp = reqHeaders.get("cf-connecting-ip")
    if (cfIp) return cfIp.trim()
  } catch {
    // headers() might not be available in non-request contexts
  }

  return "127.0.0.1"
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetInSeconds: number
}

/**
 * Checks and increments rate limit for a given key.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  cleanupExpired()

  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    }
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000)
    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    }
  }

  record.count += 1
  const resetInSeconds = Math.ceil((record.resetTime - now) / 1000)
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetInSeconds,
  }
}

/**
 * Throws a user-friendly error if the rate limit is exceeded.
 */
export async function assertRateLimit(
  actionName: string,
  limit: number,
  windowSeconds: number,
  customIdentifier?: string,
  customErrorMessage?: string
): Promise<void> {
  const ip = customIdentifier || (await getClientIp())
  const key = `${actionName}:${ip}`
  const result = checkRateLimit(key, limit, windowSeconds)

  if (!result.success) {
    const message =
      customErrorMessage ||
      `تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار ${result.resetInSeconds} ثانية والمحاولة مجدداً.`
    throw new Error(message)
  }
}

/**
 * Pre-configured rate limits for common application actions
 */
export const RateLimits = {
  // Admin login: 5 attempts per 5 minutes per IP
  ADMIN_LOGIN: {
    limit: 5,
    windowSeconds: 300,
    action: "admin_login",
    errorMessage: "تجاوزت الحد المسموح لمحاولات تسجيل الدخول. يرجى الانتظار 5 دقائق والمحاولة مجدداً.",
  },

  // Public checkout: 5 orders per 10 minutes per IP
  CHECKOUT: {
    limit: 5,
    windowSeconds: 600,
    action: "checkout",
    errorMessage: "تم إرسال عدد كبير من الطلبات في وقت قصير. يرجى الانتظار بضع دقائق قبل إرسال طلب جديد.",
  },

  // Contact form: 5 submissions per 10 minutes per IP
  CONTACT: {
    limit: 5,
    windowSeconds: 600,
    action: "contact",
    errorMessage: "تم إرسال عدة رسائل مؤخراً. يرجى الانتظار قليلاً قبل إرسال رسالة جديدة.",
  },

  // CSV Import: 10 imports per 15 minutes
  CSV_IMPORT: {
    limit: 10,
    windowSeconds: 900,
    action: "csv_import",
    errorMessage: "تم الوصول إلى الحد الأقصى لعمليات استيراد CSV. يرجى الانتظار قليلاً.",
  },

  // Sensitive mutations (products, categories, settings): 40 requests per minute
  MUTATIONS: {
    limit: 40,
    windowSeconds: 60,
    action: "sensitive_mutations",
    errorMessage: "تم إرسال عدد كبير من العمليات في وقت قصير. يرجى التمهل قليلاً.",
  },
}
