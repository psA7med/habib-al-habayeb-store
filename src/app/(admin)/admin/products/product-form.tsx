"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createProductAction, updateProductAction, type ProductFormData } from "./actions"

interface CategoryOption {
  id: string
  nameAr: string
}

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string }
  categoriesList: CategoryOption[]
}

export function ProductForm({ initialData, categoriesList }: ProductFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialData?.id)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nameAr, setNameAr] = useState(initialData?.nameAr || "")
  const [nameEn, setNameEn] = useState(initialData?.nameEn || "")
  const [slug, setSlug] = useState(initialData?.slug || "")
  const [priceEgp, setPriceEgp] = useState<string>(
    initialData?.priceEgp !== undefined ? String(initialData.priceEgp) : ""
  )
  const [compareAtPriceEgp, setCompareAtPriceEgp] = useState<string>(
    initialData?.compareAtPriceEgp !== undefined && initialData?.compareAtPriceEgp !== null
      ? String(initialData.compareAtPriceEgp)
      : ""
  )
  const [sku, setSku] = useState(initialData?.sku || "")
  const [barcode, setBarcode] = useState(initialData?.barcode || "")
  const [quantity, setQuantity] = useState<string>(
    initialData?.quantity !== undefined ? String(initialData.quantity) : "10"
  )
  const [trackInventory, setTrackInventory] = useState(initialData?.trackInventory ?? true)
  const [status, setStatus] = useState<"draft" | "active" | "archived">(
    initialData?.status || "active"
  )
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.categoryIds || []
  )
  const [descriptionAr, setDescriptionAr] = useState(initialData?.descriptionAr || "")
  const [bodyAr, setBodyAr] = useState(initialData?.bodyAr || "")
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialData?.imageUrls?.length ? initialData.imageUrls : [""]
  )

  const handleNameChange = (val: string) => {
    setNameAr(val)
    if (!isEditing && !slug) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40)
      setSlug(generatedSlug || `prod-${Date.now().toString().slice(-4)}`)
    }
  }

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, ""])
  }

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls]
    updated[index] = val
    setImageUrls(updated)
  }

  const toggleCategory = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId))
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const parsedPrice = parseFloat(priceEgp)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("يرجى إدخال سعر صحيح للمنتج.")
      setLoading(false)
      return
    }

    const payload: ProductFormData = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      slug: slug.trim().toLowerCase(),
      descriptionAr: descriptionAr.trim(),
      bodyAr: bodyAr.trim() || undefined,
      status,
      isFeatured,
      categoryIds: selectedCategoryIds,
      tags: [],
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      priceEgp: parsedPrice,
      compareAtPriceEgp: compareAtPriceEgp ? parseFloat(compareAtPriceEgp) : undefined,
      quantity: parseInt(quantity, 10) || 0,
      trackInventory,
      imageUrls: imageUrls.filter((url) => url.trim().length > 0),
    }

    try {
      if (isEditing && initialData?.id) {
        await updateProductAction(initialData.id, payload)
      } else {
        await createProductAction(payload)
      }
      router.push("/admin/products")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ المنتج.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لقائمة المنتجات
        </Link>
        <Button type="submit" disabled={loading} className="bg-neutral-900 text-white">
          {loading ? "جاري الحفظ..." : isEditing ? "تحديث المنتج" : "إنشاء المنتج"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Info */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-neutral-900 text-base">البيانات الأساسية</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              اسم المنتج بالعربية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: جبنة رومي قديمة 250 جم"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              الاسم بالإنجليزية (اختياري)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Aged Roumi Cheese 250g"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            الرابط اللطيف (Slug) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="aged-roumi-cheese"
            dir="ltr"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-neutral-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            وصف مختصر
          </label>
          <textarea
            rows={2}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder="وصف سريع يظهر تحت اسم المنتج..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-neutral-900 text-base">السعر والمخزون</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              السعر (بالجنيه المصري) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.25"
              required
              value={priceEgp}
              onChange={(e) => setPriceEgp(e.target.value)}
              placeholder="50.00"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              السعر قبل الخصم (اختياري)
            </label>
            <input
              type="number"
              step="0.25"
              value={compareAtPriceEgp}
              onChange={(e) => setCompareAtPriceEgp(e.target.value)}
              placeholder="65.00"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              الكمية المتوفرة
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="25"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              كود المنتج (SKU)
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="HAB-DAIRY-01"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              الباركود (Barcode)
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="6221234567890"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-neutral-900 text-base">الأقسام</h2>
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id)
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {cat.nameAr}
              </button>
            )
          })}
        </div>
      </div>

      {/* Images */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-neutral-900 text-base">روابط صور المنتج</h2>
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة رابط صورة
          </button>
        </div>

        <div className="space-y-3">
          {imageUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageUrlChange(i, e.target.value)}
                placeholder="https://example.com/product-image.webp"
                dir="ltr"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveImageUrl(i)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility & Status */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-neutral-900 text-base">حالة النشر والظهور</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              حالة المنتج
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none bg-white"
            >
              <option value="active">نشط (يظهر في المتجر)</option>
              <option value="draft">مسودة (مخفي)</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-neutral-800">
              منتج مميز (يظهر في قسم المنتجات المميزة بالصفحة الرئيسية)
            </label>
          </div>
        </div>
      </div>
    </form>
  )
}
