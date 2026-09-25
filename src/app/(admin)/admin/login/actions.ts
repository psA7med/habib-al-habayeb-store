"use server"

import { assertRateLimit, RateLimits } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export interface LoginResult {
  success: boolean
  error?: string
}

export async function loginAdminAction(formData: FormData): Promise<LoginResult> {
  // 1. Enforce strict rate limiting on login attempts
  await assertRateLimit(
    RateLimits.ADMIN_LOGIN.action,
    RateLimits.ADMIN_LOGIN.limit,
    RateLimits.ADMIN_LOGIN.windowSeconds,
    undefined,
    RateLimits.ADMIN_LOGIN.errorMessage
  )

  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return {
      success: false,
      error: "البريد الإلكتروني وكلمة المرور مطلوبان.",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: "بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.",
    }
  }

  return {
    success: true,
  }
}
