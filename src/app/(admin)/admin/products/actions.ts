"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import {
  products,
  productVariants,
  productImages,
  productCategories,
  categories,
} from "@/db/schema"
import { eq, inArray, desc, and, sql } from "drizzle-orm"
import { requireAdmin } from "@/lib/supabase/auth"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

// --- Validation Schemas ---

const productSchema = z.object({
  nameAr: z.string().min(2, "اسم المنتج مطلوب (حرفين على الأقل)"),
  nameEn: z.string().optional().default(""),
  slug: z
    .string()
    .min(2, "الرابط اللطيف مطلوب")
    .regex(/^[a-z0-9-]+$/, "الرابط اللطيف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  descriptionAr: z.string().optional().default(""),
  bodyAr: z.string().nullish().default(""),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  isFeatured: z.boolean().default(false),
  categoryIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  // Primary variant
  sku: z.string().optional().default(""),
  barcode: z.string().nullish().default(""),
  priceEgp: z.number().min(0.01, "السعر يجب أن يكون أكبر من صفر"),
  compareAtPriceEgp: z.number().nullish(),
  quantity: z.number().int().min(0, "الكمية لا يمكن أن تكون سالبة").default(0),
  trackInventory: z.boolean().default(true),
  // Images
  imageUrls: z.array(z.string().url()).default([]),
})

export type ProductFormData = z.input<typeof productSchema>

export async function createProductAction(data: ProductFormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const validated = productSchema.parse(data)

  const newProductId = crypto.randomUUID()
  const pricePiasters = Math.round(validated.priceEgp * 100)
  const compareAtPricePiasters = validated.compareAtPriceEgp
    ? Math.round(validated.compareAtPriceEgp * 100)
    : null

  // 1. Insert product
  await db.insert(products).values({
    id: newProductId,
    nameAr: validated.nameAr,
    nameEn: validated.nameEn,
    slug: validated.slug,
    descriptionAr: validated.descriptionAr,
    bodyAr: validated.bodyAr || null,
    status: validated.status,
    isFeatured: validated.isFeatured,
    tags: validated.tags,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 2. Insert primary variant
  const variantId = crypto.randomUUID()
  await db.insert(productVariants).values({
    id: variantId,
    productId: newProductId,
    nameAr: validated.nameAr,
    sku: validated.sku,
    barcode: validated.barcode || null,
    price: pricePiasters,
    compareAtPrice: compareAtPricePiasters,
    currency: "EGP",
    quantity: validated.quantity,
    trackInventory: validated.trackInventory,
    isActive: true,
  })

  // 3. Insert category mappings
  if (validated.categoryIds.length > 0) {
    for (let i = 0; i < validated.categoryIds.length; i++) {
      await db.insert(productCategories).values({
        productId: newProductId,
        categoryId: validated.categoryIds[i],
        isPrimary: i === 0,
      })
    }
  }

  // 4. Insert images
  if (validated.imageUrls.length > 0) {
    for (let i = 0; i < validated.imageUrls.length; i++) {
      await db.insert(productImages).values({
        id: crypto.randomUUID(),
        productId: newProductId,
        url: validated.imageUrls[i],
        altAr: validated.nameAr,
        sortOrder: i,
        isCover: i === 0,
      })
    }
  }

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
  return { success: true, productId: newProductId }
}

export async function updateProductAction(id: string, data: ProductFormData) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  const validated = productSchema.parse(data)

  const pricePiasters = Math.round(validated.priceEgp * 100)
  const compareAtPricePiasters = validated.compareAtPriceEgp
    ? Math.round(validated.compareAtPriceEgp * 100)
    : null

  // 1. Update product
  await db
    .update(products)
    .set({
      nameAr: validated.nameAr,
      nameEn: validated.nameEn,
      slug: validated.slug,
      descriptionAr: validated.descriptionAr,
      bodyAr: validated.bodyAr || null,
      status: validated.status,
      isFeatured: validated.isFeatured,
      tags: validated.tags,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))

  // 2. Update primary variant (or create if missing)
  const existingVariants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .limit(1)

  if (existingVariants.length > 0) {
    await db
      .update(productVariants)
      .set({
        nameAr: validated.nameAr,
        sku: validated.sku,
        barcode: validated.barcode || null,
        price: pricePiasters,
        compareAtPrice: compareAtPricePiasters,
        quantity: validated.quantity,
        trackInventory: validated.trackInventory,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, existingVariants[0].id))
  } else {
    await db.insert(productVariants).values({
      id: crypto.randomUUID(),
      productId: id,
      nameAr: validated.nameAr,
      sku: validated.sku,
      barcode: validated.barcode || null,
      price: pricePiasters,
      compareAtPrice: compareAtPricePiasters,
      currency: "EGP",
      quantity: validated.quantity,
      trackInventory: validated.trackInventory,
      isActive: true,
    })
  }

  // 3. Update category associations
  await db.delete(productCategories).where(eq(productCategories.productId, id))
  if (validated.categoryIds.length > 0) {
    for (let i = 0; i < validated.categoryIds.length; i++) {
      await db.insert(productCategories).values({
        productId: id,
        categoryId: validated.categoryIds[i],
        isPrimary: i === 0,
      })
    }
  }

  // 4. Update images
  await db.delete(productImages).where(eq(productImages.productId, id))
  if (validated.imageUrls.length > 0) {
    for (let i = 0; i < validated.imageUrls.length; i++) {
      await db.insert(productImages).values({
        id: crypto.randomUUID(),
        productId: id,
        url: validated.imageUrls[i],
        altAr: validated.nameAr,
        sortOrder: i,
        isCover: i === 0,
      })
    }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  revalidatePath("/shop")
  revalidatePath("/")
  return { success: true }
}

export async function setProductStatusAction(id: string, status: "draft" | "active" | "archived") {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  await db
    .update(products)
    .set({ status, updatedAt: new Date() })
    .where(eq(products.id, id))

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
  return { success: true }
}

export async function deleteProductAction(id: string) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  // Cascade delete handles variants, images, categories mappings
  await db.delete(products).where(eq(products.id, id))

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
  return { success: true }
}
