"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, PhoneCall, ShoppingBag } from "lucide-react"

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order_number")
  const total = searchParams.get("total")

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center" dir="rtl">
        <h1 className="text-2xl font-bold tracking-tight">جاري تحميل تأكيد الطلب...</h1>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8" dir="rtl">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle className="h-10 w-10" />
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          تم استلام طلبك بنجاح!
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-md">
          شكراً لتسوقك من حبيب الحبايب. سنقوم بتجهيز الطلب والتواصل معك لتأكيد التوصيل في أسرع وقت.
        </p>

        {orderNumber && (
          <Card className="mt-8 w-full border-neutral-200 shadow-sm text-right">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-3">
                <span className="text-neutral-500">رقم الطلب</span>
                <span className="font-mono font-bold text-neutral-900 text-base">{orderNumber}</span>
              </div>
              {total && (
                <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-3">
                  <span className="text-neutral-500">إجمالي المبلغ المطلوب عند الاستلام</span>
                  <span className="font-bold text-neutral-900 text-base">{total} ج.م</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-neutral-500">طريقة الدفع</span>
                <span className="font-medium text-neutral-800">الدفع نقدياً عند الاستلام</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
          <Button asChild className="bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-2">
            <Link href="/shop">
              <ShoppingBag className="h-4 w-4" />
              متابعة التسوق
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/contact">
              <PhoneCall className="h-4 w-4" />
              تواصل مع المتجر
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
