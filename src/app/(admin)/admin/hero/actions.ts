"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { heroSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/supabase/auth"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

const heroSchema = z.object({
  desktopImageUrl: z.string().min(1, "رابط صورة سطح المكتب مطلوب"),
  mobileImageUrl: z.string().min(1, "رابط صورة الموبايل مطلوب"),
  announcementText: z.string().default("أول سوبر ماركت أونلاين في الغنايم"),
  overlayTextAr: z.string().optional().nullable(),
  isEnabled: z.boolean().default(true),
  ctaUrl: z.string().optional().nullable(),
  ctaTextAr: z.string().optional().nullable(),
})

export type HeroFormData = z.infer<typeof heroSchema>

export async function getHeroSettings() {
  try {
    const [settings] = await db
      .select()
      .from(heroSettings)
      .where(eq(heroSettings.id, "default"))
      .limit(1)

    return (
      settings || {
        desktopImageUrl: "/hero-desktop.webp",
        mobileImageUrl: "/hero-mobile.webp",
        announcementText: "أول سوبر ماركت أونلاين في الغنايم",
        overlayTextAr: null,
        isEnabled: true,
        ctaUrl: null,
        ctaTextAr: null,
      }
    )
  } catch (err) {
    console.warn("Could not query hero_settings from DB:", err)
    return {
      desktopImageUrl: "/hero-desktop.webp",
      mobileImageUrl: "/hero-mobile.webp",
      announcementText: "أول سوبر ماركت أونلاين في الغنايم",
      overlayTextAr: null,
      isEnabled: true,
      ctaUrl: null,
      ctaTextAr: null,
    }
  }
}

export async function updateHeroSettingsAction(data: HeroFormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const validated = heroSchema.parse(data)

  await db
    .insert(heroSettings)
    .values({
      id: "default",
      desktopImageUrl: validated.desktopImageUrl,
      mobileImageUrl: validated.mobileImageUrl,
      announcementText: validated.announcementText,
      overlayTextAr: validated.overlayTextAr || null,
      isEnabled: validated.isEnabled,
      ctaUrl: validated.ctaUrl || null,
      ctaTextAr: validated.ctaTextAr || null,
      updatedAt: new Date(),
      updatedBy: admin.id,
    })
    .onConflictDoUpdate({
      target: heroSettings.id,
      set: {
        desktopImageUrl: validated.desktopImageUrl,
        mobileImageUrl: validated.mobileImageUrl,
        announcementText: validated.announcementText,
        overlayTextAr: validated.overlayTextAr || null,
        isEnabled: validated.isEnabled,
        ctaUrl: validated.ctaUrl || null,
        ctaTextAr: validated.ctaTextAr || null,
        updatedAt: new Date(),
        updatedBy: admin.id,
      },
    })

  revalidatePath("/admin/hero")
  revalidatePath("/")
  return { success: true }
}
