"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  UploadCloud,
  ImageIcon,
  Sliders,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const adminNav = [
  { name: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
  { name: "المنتجات", href: "/admin/products", icon: Package },
  { name: "استيراد CSV", href: "/admin/products/import", icon: UploadCloud },
  { name: "الأقسام", href: "/admin/categories", icon: FolderTree },
  { name: "الطلبات", href: "/admin/orders", icon: ShoppingCart },
  { name: "مكتبة الوسائط", href: "/admin/media", icon: ImageIcon },
  { name: "إعدادات الهيرو", href: "/admin/hero", icon: Sliders },
  { name: "إعدادات المتجر", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Skip admin chrome on login page
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

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
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 border-l bg-white shadow-sm flex flex-col shrink-0">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/admin" className="text-lg font-bold text-neutral-900">
            حبيب الحبايب <span className="text-xs font-normal text-primary">الإدارة</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <span>زيارة المتجر</span>
            <ExternalLink className="h-4 w-4" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-[1600px]">{children}</main>
    </div>
  )
}
