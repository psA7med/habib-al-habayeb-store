import Link from "next/link"
import { db } from "@/db"
import { orders, products, categories } from "@/db/schema"
import { sql, desc, eq } from "drizzle-orm"
import {
  Banknote,
  ShoppingCart,
  Package,
  FolderTree,
  UploadCloud,
  Plus,
  ArrowLeft,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "لوحة التحكم — حبيب الحبايب",
}

export default async function AdminDashboardPage() {
  let totalOrdersCount = 0
  let pendingOrdersCount = 0
  let totalRevenuePiasters = 0
  let totalProductsCount = 0
  let totalCategoriesCount = 0
  let recentOrdersList: Array<typeof orders.$inferSelect> = []

  try {
    const [ordersCountRes, pendingCountRes, revenueRes, productsCountRes, catCountRes, recentOrders] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(orders),
        db.select({ count: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")),
        db.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::bigint` }).from(orders),
        db.select({ count: sql<number>`count(*)::int` }).from(products),
        db.select({ count: sql<number>`count(*)::int` }).from(categories),
        db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
      ])

    totalOrdersCount = ordersCountRes[0]?.count ?? 0
    pendingOrdersCount = pendingCountRes[0]?.count ?? 0
    totalRevenuePiasters = Number(revenueRes[0]?.total ?? 0)
    totalProductsCount = productsCountRes[0]?.count ?? 0
    totalCategoriesCount = catCountRes[0]?.count ?? 0
    recentOrdersList = recentOrders
  } catch (err) {
    console.warn("Dashboard DB stats query fallback:", err)
  }

  const revenueEgp = (totalRevenuePiasters / 100).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            لوحة تحكم حبيب الحبايب
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            ملخص أداء المتجر، الطلبات الواردة، وحالة الكتالوج.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products/import">
            <Button variant="outline" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              استيراد CSV
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800">
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">إجمالي المبيعات</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{revenueEgp} ج.م</div>
          <p className="text-[11px] text-neutral-400 mt-1">طلبات الدفع عند الاستلام</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">إجمالي الطلبات</span>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalOrdersCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {pendingOrdersCount} طلب قيد الانتظار
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">المنتجات في الكتالوج</span>
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalProductsCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">منتجات مسجلة في قاعدة البيانات</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">أقسام المتجر</span>
            <FolderTree className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalCategoriesCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">تصنيفات نشطة</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">أحدث الطلبات</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              آخر الطلبات المسجلة في المتجر.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline"
          >
            <span>عرض كل الطلبات</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
              <tr>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">العميل</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">المجموع</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {recentOrdersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 text-xs">
                    لا توجد طلبات واردة بعد.
                  </td>
                </tr>
              ) : (
                recentOrdersList.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900 text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="p-4 font-medium text-neutral-900">{order.guestName}</td>
                    <td className="p-4 text-neutral-600 font-mono text-xs" dir="ltr">
                      {order.guestPhone}
                    </td>
                    <td className="p-4 font-bold text-neutral-900">
                      {(order.total / 100).toFixed(2)} ج.م
                    </td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200"
                      >
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
