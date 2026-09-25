import Link from "next/link"
import { db } from "@/db"
import { products, productVariants, productCategories, categories } from "@/db/schema"
import { desc, inArray } from "drizzle-orm"
import { Plus, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductTableActions } from "./product-table-actions"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "إدارة المنتجات — لوحة التحكم | حبيب الحبايب",
}

export default async function AdminProductsPage() {
  let allProducts: Array<typeof products.$inferSelect> = []
  let variantsList: Array<typeof productVariants.$inferSelect> = []
  let catJoins: Array<typeof productCategories.$inferSelect> = []
  let allCats: Array<typeof categories.$inferSelect> = []

  try {
    allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))

    const productIds = allProducts.map((p) => p.id)

    if (productIds.length > 0) {
      ;[variantsList, catJoins, allCats] = await Promise.all([
        db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
        db.select().from(productCategories).where(inArray(productCategories.productId, productIds)),
        db.select().from(categories),
      ])
    }
  } catch (err) {
    console.warn("Could not query products in admin page:", err)
  }

  const categoryMap = new Map(allCats.map((c) => [c.id, c.nameAr]))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">المنتجات</h1>
          <p className="text-sm text-neutral-600 mt-1">
            إدارة كتالوج المنتجات، الأسعار، المخزون، والأقسام.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products/import">
            <Button variant="outline" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              استيراد CSV
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800">
              <Plus className="h-4 w-4" />
              إضافة منتج جديد
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-700">
              <tr>
                <th className="p-4">اسم المنتج</th>
                <th className="p-4">السعر</th>
                <th className="p-4">الكود (SKU)</th>
                <th className="p-4">القسم</th>
                <th className="p-4">المخزون</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {allProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-500">
                    لا توجد منتجات حتى الآن. يمكنك إضافة منتج جديد أو استيراد ملف CSV.
                  </td>
                </tr>
              ) : (
                allProducts.map((prod) => {
                  const variant = variantsList.find((v) => v.productId === prod.id)
                  const prodCats = catJoins
                    .filter((c) => c.productId === prod.id)
                    .map((c) => categoryMap.get(c.categoryId))
                    .filter(Boolean)

                  const priceEgp = variant ? (variant.price / 100).toFixed(2) : "0.00"

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-semibold text-neutral-900">
                        {prod.nameAr}
                        {prod.isFeatured && (
                          <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                            مميز
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-neutral-900">{priceEgp} ج.م</td>
                      <td className="p-4 text-neutral-600 font-mono text-xs">
                        {variant?.sku || "-"}
                      </td>
                      <td className="p-4 text-neutral-600">
                        {prodCats.length > 0 ? prodCats.join(", ") : "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-medium ${
                            (variant?.quantity ?? 0) <= 0
                              ? "text-red-600"
                              : (variant?.quantity ?? 0) < 5
                              ? "text-amber-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {variant?.quantity ?? 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            prod.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : prod.status === "draft"
                              ? "bg-neutral-100 text-neutral-700"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {prod.status === "active"
                            ? "نشط"
                            : prod.status === "draft"
                            ? "مسودة"
                            : "مؤرشف"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <ProductTableActions
                          productId={prod.id}
                          currentStatus={prod.status as any}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
