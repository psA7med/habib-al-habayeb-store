"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface AdminNavItem {
  name: string
  href: string
  icon: LucideIcon
}

export function AdminNavLinks({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
      {items.map((item) => {
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
  )
}
