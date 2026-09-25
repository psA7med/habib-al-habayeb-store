"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, FolderTree, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  type CategoryFormData,
} from "./actions"

interface CategoryItem {
  id: string
  nameAr: string
  nameEn: string
  slug: string
  descriptionAr: string
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
}

export function CategoryManager({ categories }: { categories: CategoryItem[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nameAr, setNameAr] = useState("")
  const [slug, setSlug] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [parentId, setParentId] = useState<string>("")
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const openCreateModal = () => {
    setEditingCat(null)
    setNameAr("")
    setSlug("")
    setDescriptionAr("")
    setImageUrl("")
    setParentId("")
    setSortOrder(categories.length)
    setIsActive(true)
    setError(null)
    setIsOpen(true)
  }

  const openEditModal = (cat: CategoryItem) => {
    setEditingCat(cat)
    setNameAr(cat.nameAr)
    setSlug(cat.slug)
    setDescriptionAr(cat.descriptionAr || "")
    setImageUrl(cat.imageUrl || "")
    setParentId(cat.parentId || "")
    setSortOrder(cat.sortOrder)
    setIsActive(cat.isActive)
    setError(null)
    setIsOpen(true)
  }

  const handleNameChange = (val: string) => {
    setNameAr(val)
    if (!editingCat && !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30)
      setSlug(generated || `cat-${Date.now().toString().slice(-4)}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload: CategoryFormData = {
      nameAr: nameAr.trim(),
      nameEn: "",
      slug: slug.trim().toLowerCase(),
      descriptionAr: descriptionAr.trim(),
      imageUrl: imageUrl.trim() || null,
      parentId: parentId || null,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    }

    try {
      if (editingCat) {
        await updateCategoryAction(editingCat.id, payload)
      } else {
        await createCategoryAction(payload)
      }
      setIsOpen(false)
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ القسم.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `هل أنت متأكد من رغبتك في حذف قسم (${name})؟\nملاحظة: المنتجات المرتبطة بهذا القسم لن تُحذف وستبقى موجودة.`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      await deleteCategoryAction(id)
    } catch (err: any) {
      alert(err?.message || "فشل حذف القسم")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          إجمالي الأقسام: <span className="font-bold text-neutral-900">{categories.length}</span>
        </p>

        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          إضافة قسم جديد
        </Button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-700">
              <tr>
                <th className="p-4">اسم القسم</th>
                <th className="p-4">الرابط اللطيف (Slug)</th>
                <th className="p-4">القسم الرئيسي</th>
                <th className="p-4">الترتيب</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-500">
                    لا توجد أقسام مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const parentCat = categories.find((c) => c.id === cat.parentId)

                  return (
                    <tr key={cat.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-semibold text-neutral-900 flex items-center gap-3">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.nameAr}
                            className="h-8 w-8 rounded-lg object-cover bg-neutral-100"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                            <FolderTree className="h-4 w-4" />
                          </div>
                        )}
                        <span>{cat.nameAr}</span>
                      </td>
                      <td className="p-4 text-neutral-600 font-mono text-xs">{cat.slug}</td>
                      <td className="p-4 text-neutral-600">{parentCat?.nameAr || "-"}</td>
                      <td className="p-4 text-neutral-600">{cat.sortOrder}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            cat.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {cat.isActive ? "نشط" : "معطل"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4 text-neutral-700" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.nameAr)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog for Create & Edit */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              {editingCat ? `تعديل قسم (${editingCat.nameAr})` : "إضافة قسم جديد"}
            </h2>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  اسم القسم بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: البان وجبن"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  الرابط اللطيف (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="dairy-and-cheese"
                  dir="ltr"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  رابط صورة القسم (اختياري)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/category.webp"
                  dir="ltr"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    القسم الرئيسي (اختياري)
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none bg-white"
                  >
                    <option value="">بدون (قسم رئيسي)</option>
                    {categories
                      .filter((c) => !editingCat || c.id !== editingCat.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    ترتيب الظهور
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-neutral-800">
                  قسم نشط ويظهر في المتجر
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-neutral-900 text-white"
                >
                  {loading ? "جاري الحفظ..." : "حفظ القسم"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
