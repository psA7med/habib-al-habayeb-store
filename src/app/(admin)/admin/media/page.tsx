import { db } from "@/db"
import { mediaFiles } from "@/db/schema"
import { desc } from "drizzle-orm"
import { MediaGallery } from "./media-gallery"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "مكتبة الوسائط — لوحة التحكم | حبيب الحبايب",
}

export default async function AdminMediaPage() {
  let allMedia: (typeof mediaFiles.$inferSelect)[] = []
  try {
    allMedia = await db
      .select()
      .from(mediaFiles)
      .orderBy(desc(mediaFiles.createdAt))
  } catch (err) {
    console.warn("Could not query media files:", err)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">مكتبة الوسائط</h1>
        <p className="mt-1 text-sm text-neutral-600">
          رفع وإدارة صور المنتجات، الأقسام، وبانرات المتجر عبر Supabase Storage.
        </p>
      </div>

      <MediaGallery initialFiles={allMedia} />
    </div>
  )
}
