"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { mediaFiles } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { uploadMedia, deleteMedia } from "@/lib/storage"
import { requireAdmin } from "@/lib/supabase/auth"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

export async function getMediaFilesAction() {
  await requireAdmin()
  return db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt))
}

export async function uploadMediaAction(formData: FormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const file = formData.get("file") as File
  if (!file) {
    throw new Error("لم يتم تحديد ملف للرفع.")
  }

  const result = await uploadMedia(file, {
    folder: "general",
    uploadedBy: admin.id,
  })

  revalidatePath("/admin/media")
  return { success: true, file: result }
}

export async function deleteMediaAction(id: string, storagePath: string) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  await deleteMedia(storagePath, id)
  revalidatePath("/admin/media")
  return { success: true }
}
