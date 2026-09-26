"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function AdminLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/admin/login")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
      router.push("/admin/login")
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </button>
  )
}
