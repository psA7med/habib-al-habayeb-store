import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { orders, orderLineItems, orderStatusHistory } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { ArrowRight, Phone, Calendar, Clock } from "lucide-react"
import { OrderStatusController } from "./order-status-controller"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "تفاصيل الطلب — لوحة التحكم | حبيب الحبايب",
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let order: typeof orders.$inferSelect | undefined
  let items: (typeof orderLineItems.$inferSelect)[] = []
  let history: (typeof orderStatusHistory.$inferSelect)[] = []

  try {
    const [ord] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    order = ord

    if (order) {
      ;[items, history] = await Promise.all([
        db.select().from(orderLineItems).where(eq(orderLineItems.orderId, id)),
        db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.createdAt)),
      ])
    }
  } catch (err) {
    console.warn("Could not query order details in admin:", err)
  }

  if (!order) {
    notFound()
  }

  const subtotalEgp = (order.subtotal / 100).toFixed(2)
  const shippingEgp = (order.shippingFee / 100).toFixed(2)
  const totalEgp = (order.total / 100).toFixed(2)

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة لكل الطلبات
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            طلب رقم: <span className="font-mono">{order.orderNumber}</span>
          </h1>
          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
            طريقة الدفع: الدفع عند الاستلام (COD)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer, Items, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-neutral-900 text-base border-b border-neutral-100 pb-3">
              بيانات العميل والتوصيل
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 text-xs block">اسم العميل:</span>
                <strong className="text-neutral-900 font-semibold">{order.guestName}</strong>
              </div>

              <div>
                <span className="text-neutral-500 text-xs block">رقم الهاتف:</span>
                <a
                  href={`tel:${order.guestPhone}`}
                  className="text-neutral-900 font-mono font-semibold hover:underline inline-flex items-center gap-1"
                  dir="ltr"
                >
                  <Phone className="h-3.5 w-3.5 text-neutral-500" />
                  {order.guestPhone}
                </a>
              </div>

              {order.guestEmail && (
                <div>
                  <span className="text-neutral-500 text-xs block">البريد الإلكتروني:</span>
                  <span className="text-neutral-800">{order.guestEmail}</span>
                </div>
              )}

              <div>
                <span className="text-neutral-500 text-xs block">المحافظة والمدينة:</span>
                <span className="text-neutral-800">
                  {order.governorate} — {order.city}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-neutral-500 text-xs block">العنوان التفصيلي:</span>
                <span className="text-neutral-900">
                  {order.addressLine} {order.buildingFloorApt ? `(${order.buildingFloorApt})` : ""}
                </span>
              </div>

              {order.deliveryNotes && (
                <div className="sm:col-span-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 text-xs block mb-1">ملاحظات التوصيل من العميل:</span>
                  <p className="text-neutral-800 text-xs">{order.deliveryNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-neutral-900 text-base border-b border-neutral-100 pb-3">
              المنتجات المطلوبة ({items.length})
            </h2>

            <div className="divide-y divide-neutral-100">
              {items.map((item) => {
                const itemPriceEgp = (item.price / 100).toFixed(2)
                const itemTotalEgp = (item.total / 100).toFixed(2)

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-12 w-12 rounded-lg object-cover bg-neutral-100"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                          صورة
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-neutral-900">{item.productName}</div>
                        <div className="text-xs text-neutral-500">
                          {itemPriceEgp} ج.م × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="font-bold text-neutral-900">{itemTotalEgp} ج.م</div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>المجموع الفرعي:</span>
                <span>{subtotalEgp} ج.م</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>مصاريف التوصيل:</span>
                <span>{Number(shippingEgp) === 0 ? "مجاني" : `${shippingEgp} ج.م`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 border-t border-neutral-200 pt-2">
                <span>الإجمالي النهائي المطلوب تحصيله:</span>
                <span>{totalEgp} ج.م</span>
              </div>
            </div>
          </div>

          {/* Status History Audit Trail */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-neutral-900 text-base border-b border-neutral-100 pb-3">
              سجل تتبع وتحديثات الطلب (Audit Trail)
            </h2>

            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-3 text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-200"
                >
                  <Clock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-neutral-900">
                        الحالة: {h.toStatus}
                      </strong>
                      <span className="text-neutral-500 font-mono">
                        {new Date(h.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {h.note && <p className="text-neutral-700">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Order Status Controller */}
        <div>
          <OrderStatusController
            orderId={order.id}
            currentStatus={order.status}
            adminNotes={order.adminNotes}
          />
        </div>
      </div>
    </div>
  )
}
