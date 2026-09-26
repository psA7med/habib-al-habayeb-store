"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { categories, productCategories } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { requireAdmin } from "@/lib/supabase/auth"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

const categorySchema = z.object({
  nameAr: z.string().min(2, "اسم القسم مطلوب"),
  nameEn: z.string().optional().default(""),
  slug: z
    .string()
    .min(2, "الرابط اللطيف مطلوب")
    .regex(/^[a-z0-9-]+$/, "الرابط اللطيف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  descriptionAr: z.string().optional().default(""),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export async function getAdminCategories() {
  await requireAdmin()
  return db.select().from(categories).orderBy(asc(categories.sortOrder))
}

export async function createCategoryAction(data: CategoryFormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const validated = categorySchema.parse(data)

  const newId = crypto.randomUUID()
  await db.insert(categories).values({
    id: newId,
    nameAr: validated.nameAr,
    nameEn: validated.nameEn,
    slug: validated.slug,
    descriptionAr: validated.descriptionAr,
    imageUrl: validated.imageUrl || null,
    parentId: validated.parentId || null,
    sortOrder: validated.sortOrder,
    isActive: validated.isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
  updateTag("categories")
  updateTag("products")
  return { success: true, id: newId }
}

export async function updateCategoryAction(id: string, data: CategoryFormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const validated = categorySchema.parse(data)

  await db
    .update(categories)
    .set({
      nameAr: validated.nameAr,
      nameEn: validated.nameEn,
      slug: validated.slug,
      descriptionAr: validated.descriptionAr,
      imageUrl: validated.imageUrl || null,
      parentId: validated.parentId || null,
      sortOrder: validated.sortOrder,
      isActive: validated.isActive,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))

  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
  updateTag("categories")
  updateTag("products")
  return { success: true }
}

export async function deleteCategoryAction(id: string) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  // Deleting a category cascade deletes product_categories mappings,
  // but products themselves remain intact in the products table.
  await db.delete(categories).where(eq(categories.id, id))

  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
  updateTag("categories")
  updateTag("products")
  return { success: true }
}

export async function updateCategorySortOrderAction(items: { id: string; sortOrder: number }[]) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  for (const item of items) {
    await db
      .update(categories)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(categories.id, item.id))
  }

  revalidatePath("/admin/categories")
  revalidatePath("/")
  updateTag("categories")
  return { success: true }
}
