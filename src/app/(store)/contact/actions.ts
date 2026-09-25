"use server"

import { assertRateLimit, RateLimits } from "@/lib/rate-limit"
import { contactFormSchema } from "@/lib/validators"

export async function submitContactFormAction(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  // Enforce rate limiting on contact form submissions
  await assertRateLimit(
    RateLimits.CONTACT.action,
    RateLimits.CONTACT.limit,
    RateLimits.CONTACT.windowSeconds,
    undefined,
    RateLimits.CONTACT.errorMessage
  )

  const validated = contactFormSchema.parse(data)

  // In production, send notification email or store contact inquiry
  return {
    success: true,
    message: "تم استلام رسالتك بنجاح! سنقوم بالتواصل معك في أقرب وقت.",
  }
}
