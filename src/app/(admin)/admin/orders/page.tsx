import Link from "next/link"
import { db } from "@/db"
import { orders, orderLineItems } from "@/db/schema"
import { desc, inArray } from "drizzle-orm"
import { Eye, Clock, CheckCircle2, Truck, PackageCheck, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "إدارة الطلبات — لوحة التحكم | حبيب الحبايب",
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-800", icon: Clock },
  confirmed: { label: "تم التأكيد", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  preparing: { label: "جاري التجهيز", color: "bg-indigo-100 text-indigo-800", icon: PackageCheck },
  out_for_delivery: { label: "خرج للتوصيل", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "تم التوصيل", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default async function AdminOrdersPage() {
  let allOrders: (typeof orders.$inferSelect)[] = []
  let lineItems: (typeof orderLineItems.$inferSelect)[] = []

  try {
    allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt))
    const orderIds = allOrders.map((o) => o.id)

    if (orderIds.length > 0) {
      lineItems = await db.select().from(orderLineItems).where(inArray(orderLineItems.orderId, orderIds))
    }
  } catch (err) {
    console.warn("Could not query orders in admin orders page:", err)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">الطلبات</h1>
          <p className="mt-1 text-sm text-neutral-600">
            متابعة طلبات الدفع عند الاستلام وحالات التجهيز والتوصيل.
          </p>
        </div>
        <div className="text-sm font-semibold text-neutral-800">
          إجمالي الطلبات: {allOrders.length}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-700">
              <tr>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">العميل</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">المحافظة / العنوان</th>
                <th className="p-4">المنتجات</th>
                <th className="p-4">المجموع</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-neutral-500">
                    لا توجد طلبات مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                allOrders.map((order) => {
                  const itemsCount = lineItems.filter((i) => i.orderId === order.id).length
                  const statusInfo = statusLabels[order.status] || {
                    label: order.status,
                    color: "bg-neutral-100 text-neutral-800",
                    icon: Clock,
                  }
                  const totalEgp = (order.total / 100).toFixed(2)

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-neutral-900">
                        {order.orderNumber}
                      </td>
                      <td className="p-4 font-medium text-neutral-900">{order.guestName}</td>
                      <td className="p-4 text-neutral-600 font-mono text-xs" dir="ltr">
                        {order.guestPhone}
                      </td>
                      <td className="p-4 text-neutral-600">
                        {order.governorate} — {order.city}
                      </td>
                      <td className="p-4 text-neutral-600">
                        {itemsCount} {itemsCount === 1 ? "منتج" : "منتجات"}
                      </td>
                      <td className="p-4 font-bold text-neutral-900">{totalEgp} ج.م</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}
                        >
                          <statusInfo.icon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          عرض
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
