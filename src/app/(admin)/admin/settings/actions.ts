"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { siteSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/supabase/auth"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

const settingsSchema = z.object({
  storeName: z.string().min(2, "اسم المتجر مطلوب"),
  announcementText: z.string().default("أول سوبر ماركت أونلاين في الغنايم"),
  hotline: z.string().optional().default(""),
  whatsapp: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  standardDeliveryFeeEgp: z.number().min(0).default(0),
  freeDeliveryThresholdEgp: z.number().min(0).optional().nullable(),
  maintenanceMode: z.boolean().default(false),
})

export type SiteSettingsFormData = z.infer<typeof settingsSchema>

export async function getSiteSettings() {
  try {
    const [settings] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "default"))
      .limit(1)

    return (
      settings || {
        storeName: "حبيب الحبايب",
        announcementText: "أول سوبر ماركت أونلاين في الغنايم",
        hotline: "",
        whatsapp: "",
        contactEmail: "",
        standardDeliveryFee: 0,
        freeDeliveryThreshold: null,
        maintenanceMode: false,
      }
    )
  } catch (err) {
    console.warn("Could not query site_settings from DB:", err)
    return {
      storeName: "حبيب الحبايب",
      announcementText: "أول سوبر ماركت أونلاين في الغنايم",
      hotline: "",
      whatsapp: "",
      contactEmail: "",
      standardDeliveryFee: 0,
      freeDeliveryThreshold: null,
      maintenanceMode: false,
    }
  }
}

export async function updateSiteSettingsAction(data: SiteSettingsFormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const validated = settingsSchema.parse(data)

  const deliveryPiasters = Math.round(validated.standardDeliveryFeeEgp * 100)
  const thresholdPiasters = validated.freeDeliveryThresholdEgp
    ? Math.round(validated.freeDeliveryThresholdEgp * 100)
    : null

  await db
    .insert(siteSettings)
    .values({
      id: "default",
      storeName: validated.storeName,
      announcementText: validated.announcementText,
      hotline: validated.hotline,
      whatsapp: validated.whatsapp,
      contactEmail: validated.contactEmail,
      standardDeliveryFee: deliveryPiasters,
      freeDeliveryThreshold: thresholdPiasters,
      maintenanceMode: validated.maintenanceMode,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        storeName: validated.storeName,
        announcementText: validated.announcementText,
        hotline: validated.hotline,
        whatsapp: validated.whatsapp,
        contactEmail: validated.contactEmail,
        standardDeliveryFee: deliveryPiasters,
        freeDeliveryThreshold: thresholdPiasters,
        maintenanceMode: validated.maintenanceMode,
        updatedAt: new Date(),
      },
    })

  revalidatePath("/admin/settings")
  revalidatePath("/")
  return { success: true }
}
