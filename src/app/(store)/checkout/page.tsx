"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useCartStore } from "@/store/cart"
import { CartSummary } from "@/components/cart/cart-summary"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { createCodOrderAction } from "./actions"

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    governorate: "أسيوط",
    city: "الغنايم",
    address: "",
    buildingFloorApt: "",
    deliveryNotes: "",
  })

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" dir="rtl">
        <h1 className="text-2xl font-bold tracking-tight">إتمام الطلب</h1>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center" dir="rtl">
        <h1 className="text-2xl font-bold tracking-tight">سلة المشتريات فارغة</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          يرجى إضافة منتجات إلى السلة قبل إتمام الطلب.
        </p>
        <Button className="mt-8 bg-neutral-900 text-white" asChild>
          <Link href="/shop">تصفح المنتجات</Link>
        </Button>
      </div>
    )
  }

  const subtotal = getSubtotal()

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، العنوان)")
      return
    }

    setLoading(true)

    try {
      const orderPayload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        governorate: form.governorate.trim() || "أسيوط",
        city: form.city.trim() || "الغنايم",
        address: form.address.trim(),
        buildingFloorApt: form.buildingFloorApt.trim() || "",
        deliveryNotes: form.deliveryNotes.trim() || "",
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      }

      const res = await createCodOrderAction(orderPayload)

      if (res.success) {
        clearCart()
        toast.success("تم إرسال طلبك بنجاح!")
        router.push(
          `/checkout/success?order_id=${res.orderId}&order_number=${res.orderNumber}&total=${res.totalEgp}`
        )
      } else {
        setError("تعذر حفظ الطلب، يرجى المحاولة مرة أخرى.")
      }
    } catch (err: any) {
      console.error("Checkout error:", err)
      const errorMsg =
        err?.message || "حدث خطأ أثناء إتمام الطلب. يرجى التأكد من البيانات والمحاولة مجدداً."
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">إتمام الطلب</h1>
      <p className="mt-1 text-sm text-neutral-600">
        الدفع عند الاستلام — سنقوم بتجهيز وتوصيل طلبك في أسرع وقت.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Form Details */}
        <div className="space-y-6 lg:col-span-3">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">بيانات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  الاسم بالكامل <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="مثال: أحمد محمد علي"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">عنوان التوصيل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="governorate">المحافظة</Label>
                  <Input
                    id="governorate"
                    name="governorate"
                    value={form.governorate}
                    onChange={handleChange}
                    placeholder="أسيوط"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">المدينة / المركز</Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="الغنايم"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  العنوان بالتفصيل <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="اسم الشارع، رقم المنزل، علامة مميزة"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingFloorApt">الدور / الشقة (اختياري)</Label>
                <Input
                  id="buildingFloorApt"
                  name="buildingFloorApt"
                  value={form.buildingFloorApt}
                  onChange={handleChange}
                  placeholder="مثال: الدور الثاني - شقة 4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">ملاحظات التوصيل (اختياري)</Label>
                <Textarea
                  id="deliveryNotes"
                  name="deliveryNotes"
                  value={form.deliveryNotes}
                  onChange={handleChange}
                  placeholder="أي تعليمات خاصة للمندوب أو وقت التوصيل المفضل"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="h-3 w-3 rounded-full bg-emerald-600" />
                <div>
                  <p className="font-semibold text-sm text-neutral-900">
                    الدفع نقدياً عند الاستلام (COD)
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    ادفع نقداً عند استلام طلبك ومراجعته عند باب منزلك.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base font-bold">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.variantId} className="flex justify-between text-sm py-1 border-b border-neutral-100 last:border-0">
                    <span className="text-neutral-700">
                      {item.name} <span className="text-neutral-400">&times; {item.quantity}</span>
                    </span>
                    <span className="font-medium text-neutral-900">{formatPrice(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <CartSummary subtotal={subtotal} />
              <Button
                type="submit"
                size="lg"
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
                disabled={loading}
              >
                {loading ? "جاري إرسال الطلب..." : "تأكيد الطلب الآن"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
