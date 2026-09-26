import Link from "next/link"
import { headers } from "next/headers"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  UploadCloud,
  ImageIcon,
  Sliders,
  Settings,
  ExternalLink,
} from "lucide-react"
import { AdminNavLinks } from "./admin-nav-links"
import { AdminLogoutButton } from "./admin-logout-button"

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Detect login page from the request URL to skip admin chrome
  const headersList = await headers()
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || ""
  if (pathname === "/admin/login") {
    return <>{children}</>
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

        <AdminNavLinks items={adminNav} />

        <div className="border-t p-4 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <span>زيارة المتجر</span>
            <ExternalLink className="h-4 w-4" />
          </Link>

          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-[1600px]">{children}</main>
    </div>
  )
}
