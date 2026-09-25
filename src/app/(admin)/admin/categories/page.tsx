import { db } from "@/db"
import { categories } from "@/db/schema"
import { asc } from "drizzle-orm"
import { CategoryManager } from "./category-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "إدارة الأقسام — لوحة التحكم | حبيب الحبايب",
}

export default async function AdminCategoriesPage() {
  let allCategories: Array<typeof categories.$inferSelect> = []
  try {
    allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder))
  } catch (err) {
    console.warn("Could not query categories in admin page:", err)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">أقسام المتجر</h1>
        <p className="mt-1 text-sm text-neutral-600">
          إدارة الأقسام والتصنيفات، الصور، والترتيب الهرمي.
        </p>
      </div>

      <CategoryManager categories={allCategories} />
    </div>
  )
}
