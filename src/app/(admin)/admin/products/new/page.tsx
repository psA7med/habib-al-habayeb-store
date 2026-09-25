import { db } from "@/db"
import { categories } from "@/db/schema"
import { asc } from "drizzle-orm"
import { ProductForm } from "../product-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "إضافة منتج جديد — لوحة التحكم | حبيب الحبايب",
}

export default async function NewProductPage() {
  let allCategories: Array<{ id: string; nameAr: string }> = []
  try {
    allCategories = await db
      .select({ id: categories.id, nameAr: categories.nameAr })
      .from(categories)
      .orderBy(asc(categories.sortOrder))
  } catch (err) {
    console.warn("Could not query categories in new product page:", err)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">إضافة منتج جديد</h1>
        <p className="mt-1 text-sm text-neutral-600">
          أدخل تفاصيل المنتج والسعر والمخزون لحفظه في المتجر.
        </p>
      </div>

      <ProductForm categoriesList={allCategories} />
    </div>
  )
}
