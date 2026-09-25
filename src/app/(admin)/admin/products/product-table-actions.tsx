"use client"

import { useState } from "react"
import Link from "next/link"
import { Edit, Eye, EyeOff, Trash2 } from "lucide-react"
import { setProductStatusAction, deleteProductAction } from "./actions"

export function ProductTableActions({
  productId,
  currentStatus,
}: {
  productId: string
  currentStatus: "draft" | "active" | "archived"
}) {
  const [loading, setLoading] = useState(false)

  const handleToggleStatus = async () => {
    if (loading) return
    setLoading(true)
    const nextStatus = currentStatus === "active" ? "draft" : "active"
    try {
      await setProductStatusAction(productId, nextStatus)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (loading) return
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟")) return
    setLoading(true)
    try {
      await deleteProductAction(productId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handleToggleStatus}
        disabled={loading}
        title={currentStatus === "active" ? "تعطيل المنتج (مسودة)" : "تفعيل المنتج"}
        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        {currentStatus === "active" ? (
          <EyeOff className="h-4 w-4 text-amber-600" />
        ) : (
          <Eye className="h-4 w-4 text-emerald-600" />
        )}
      </button>

      <Link
        href={`/admin/products/${productId}`}
        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
        title="تعديل"
      >
        <Edit className="h-4 w-4 text-neutral-700" />
      </Link>

      <button
        onClick={handleDelete}
        disabled={loading}
        title="حذف"
        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
