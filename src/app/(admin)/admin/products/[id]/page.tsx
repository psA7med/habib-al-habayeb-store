import { notFound } from "next/navigation"
import { db } from "@/db"
import { products, productVariants, productImages, productCategories, categories } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { ProductForm } from "../product-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "تعديل المنتج — لوحة التحكم | حبيب الحبايب",
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let prod: typeof products.$inferSelect | undefined
  let variantsList: (typeof productVariants.$inferSelect)[] = []
  let imagesList: (typeof productImages.$inferSelect)[] = []
  let catJoins: (typeof productCategories.$inferSelect)[] = []
  let allCategories: Array<{ id: string; nameAr: string }> = []

  try {
    const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1)
    prod = p

    if (prod) {
      ;[variantsList, imagesList, catJoins, allCategories] = await Promise.all([
        db.select().from(productVariants).where(eq(productVariants.productId, id)),
        db.select().from(productImages).where(eq(productImages.productId, id)),
        db.select().from(productCategories).where(eq(productCategories.productId, id)),
        db.select({ id: categories.id, nameAr: categories.nameAr }).from(categories).orderBy(asc(categories.sortOrder)),
      ])
    }
  } catch (err) {
    console.warn("Could not query product details in edit page:", err)
  }

  if (!prod) {
    notFound()
  }

  const primaryVariant = variantsList[0]
  const initialData = {
    id: prod.id,
    nameAr: prod.nameAr,
    nameEn: prod.nameEn,
    slug: prod.slug,
    descriptionAr: prod.descriptionAr,
    bodyAr: prod.bodyAr || undefined,
    status: prod.status as "draft" | "active" | "archived",
    isFeatured: prod.isFeatured,
    categoryIds: catJoins.map((c) => c.categoryId),
    tags: prod.tags,
    sku: primaryVariant?.sku || "",
    barcode: primaryVariant?.barcode || undefined,
    priceEgp: primaryVariant ? primaryVariant.price / 100 : 0,
    compareAtPriceEgp: primaryVariant?.compareAtPrice ? primaryVariant.compareAtPrice / 100 : undefined,
    quantity: primaryVariant?.quantity ?? 0,
    trackInventory: primaryVariant?.trackInventory ?? true,
    imageUrls: imagesList.map((img) => img.url),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">تعديل المنتج</h1>
        <p className="mt-1 text-sm text-neutral-600">
          تعديل بيانات ({prod.nameAr}) وتحديث الأسعار والمخزون.
        </p>
      </div>

      <ProductForm initialData={initialData} categoriesList={allCategories} />
    </div>
  )
}
