import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const metadata = {
  title: "تسجيل الدخول — لوحة التحكم | حبيب الحبايب",
  description: "تسجيل الدخول لمدراء متجر حبيب الحبايب",
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-neutral-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">لوحة تحكم حبيب الحبايب</h1>
          <p className="mt-2 text-sm text-neutral-600">
            يرجى إدخال بيانات الدخول لإدارة المتجر
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-4 text-xs text-neutral-400">جاري التحميل...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
