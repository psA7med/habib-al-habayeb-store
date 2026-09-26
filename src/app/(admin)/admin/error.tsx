"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900">حدث خطأ أثناء تحميل البيانات</h2>
      <p className="mt-2 text-sm text-neutral-600 max-w-md">
        تعذر إكمال العملية المطلوبة حالياً. يمكنك إعادة المحاولة.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} className="bg-neutral-900 text-white flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  )
}
