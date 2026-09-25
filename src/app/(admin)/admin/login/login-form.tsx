"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loginAdminAction } from "./actions"
import { Button } from "@/components/ui/button"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const result = await loginAdminAction(formData)

      if (!result.success) {
        setError(result.error || "بيانات تسجيل الدخول غير صحيحة.")
        setLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-right">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          placeholder="admin@habib.store"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          كلمة المرور
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          placeholder="••••••••"
          dir="ltr"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full mt-2"
      >
        {loading ? "جاري تسجيل الدخول..." : "دخول إلى لوحة التحكم"}
      </Button>
    </form>
  )
}
