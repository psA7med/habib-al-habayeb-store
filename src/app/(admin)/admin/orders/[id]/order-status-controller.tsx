"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateOrderStatusAction, updateOrderAdminNotesAction } from "../actions"

const statuses = [
  { key: "pending", label: "قيد الانتظار" },
  { key: "confirmed", label: "تأكيد الطلب" },
  { key: "preparing", label: "جاري التجهيز" },
  { key: "out_for_delivery", label: "خرج للتوصيل" },
  { key: "delivered", label: "تم التوصيل" },
  { key: "cancelled", label: "إلغاء الطلب" },
] as const

export function OrderStatusController({
  orderId,
  currentStatus,
  adminNotes,
}: {
  orderId: string
  currentStatus: string
  adminNotes: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const [notesText, setNotesText] = useState(adminNotes || "")
  const [savingNotes, setSavingNotes] = useState(false)

  const handleStatusChange = async (nextStatus: (typeof statuses)[number]["key"]) => {
    if (loading) return
    setLoading(true)
    try {
      await updateOrderStatusAction(orderId, nextStatus, note.trim() || undefined)
      setNote("")
    } catch (err: any) {
      alert(err?.message || "فشل تحديث حالة الطلب")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await updateOrderAdminNotesAction(orderId, notesText)
      alert("تم حفظ الملاحظات بنجاح")
    } catch (err: any) {
      alert(err?.message || "فشل حفظ الملاحظات")
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-bold text-neutral-900">تحديث حالة الطلب</h3>

        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => {
            const isCurrent = s.key === currentStatus
            const isCancel = s.key === "cancelled"
            return (
              <Button
                key={s.key}
                type="button"
                onClick={() => handleStatusChange(s.key)}
                disabled={loading || isCurrent}
                variant={isCurrent ? "default" : "outline"}
                className={`text-xs ${
                  isCurrent
                    ? "bg-neutral-900 text-white font-bold"
                    : isCancel
                    ? "text-red-600 hover:bg-red-50 hover:border-red-200"
                    : ""
                }`}
              >
                {s.label} {isCurrent && "(الحالية)"}
              </Button>
            )
          })}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            ملاحظة إضافية لسجل تغيير الحالة (اختياري)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: تم الاتصال بالعميل وتأكيد العنوان"
            className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-neutral-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
        <h3 className="text-base font-bold text-neutral-900">ملاحظات الإدارة الداخلية</h3>
        <textarea
          rows={3}
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          placeholder="ملاحظات سرية للإدارة فقط..."
          className="w-full rounded-lg border border-neutral-300 p-3 text-xs focus:border-neutral-900 focus:outline-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="bg-neutral-900 text-white"
          >
            {savingNotes ? "جاري الحفظ..." : "حفظ الملاحظات"}
          </Button>
        </div>
      </div>
    </div>
  )
}
