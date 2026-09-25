import type {
  Order,
  OrderLineItem,
  OrderRepository,
  OrderStatus,
  PaginationParams,
  PaginatedResult,
} from "@/types"
import { db } from "@/db"
import { orders, orderLineItems, orderStatusHistory, paymentRecords } from "@/db/schema"
import { eq, desc, sql, inArray } from "drizzle-orm"

function mapDbOrderToDomain(
  row: typeof orders.$inferSelect,
  itemsList: (typeof orderLineItems.$inferSelect)[] = []
): Order {
  const items: OrderLineItem[] = itemsList.map((item) => ({
    id: item.id,
    productId: item.productId || "",
    variantId: item.variantId || "",
    name: item.productName,
    variantName: item.variantTitle,
    sku: item.sku,
    image: {
      url: item.imageUrl || "/images/placeholder.svg",
      alt: item.productName,
    },
    price: item.price,
    quantity: item.quantity,
    total: item.total,
  }))

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.customerId ?? undefined,
    items,
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as any,
    subtotal: row.subtotal,
    tax: 0,
    shipping: row.shippingFee,
    total: row.total,
    currency: row.currency,
    customerName: row.guestName,
    customerEmail: row.guestEmail ?? undefined,
    shippingAddress: {
      id: row.id,
      type: "shipping",
      firstName: row.guestName.split(" ")[0] || row.guestName,
      lastName: row.guestName.split(" ").slice(1).join(" ") || "",
      line1: row.addressLine,
      line2: row.buildingFloorApt ?? undefined,
      city: row.city,
      state: row.governorate,
      postalCode: "",
      country: "EG",
      phone: row.guestPhone,
      isDefault: true,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const dbOrderRepository: OrderRepository & {
  getByOrderNumber(orderNumber: string): Promise<Order | null>
} = {
  async list(userId?: string, pagination?: PaginationParams): Promise<PaginatedResult<Order>> {
    const page = Math.max(1, pagination?.page ?? 1)
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 10))
    const offset = (page - 1) * limit

    const whereClause = userId ? eq(orders.customerId, userId) : undefined

    const [countRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause)

    const total = countRes?.count ?? 0
    const totalPages = Math.ceil(total / limit)

    if (total === 0) {
      return {
        items: [],
        pagination: { total: 0, page, limit, totalPages: 0, hasNext: false, hasPrev: false },
      }
    }

    const rows = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    const orderIds = rows.map((r) => r.id)
    const lineItemsRows =
      orderIds.length > 0
        ? await db.select().from(orderLineItems).where(inArray(orderLineItems.orderId, orderIds))
        : []

    const items = rows.map((row) => {
      const pItems = lineItemsRows.filter((i) => i.orderId === row.id)
      return mapDbOrderToDomain(row, pItems)
    })

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  },

  async getById(id: string): Promise<Order | null> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!row) return null

    const itemsRows = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, row.id))
    return mapDbOrderToDomain(row, itemsRows)
  },

  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1)
    if (!row) return null

    const itemsRows = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, row.id))
    return mapDbOrderToDomain(row, itemsRows)
  },

  async create(orderData): Promise<Order> {
    const newOrderId = crypto.randomUUID()
    const now = new Date()
    const orderNum =
      orderData.orderNumber ||
      `HAB-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    const [createdOrder] = await db
      .insert(orders)
      .values({
        id: newOrderId,
        orderNumber: orderNum,
        customerId: orderData.userId || null,
        status: (orderData.status as any) || "pending",
        paymentStatus: (orderData.paymentStatus as any) || "pending",
        paymentMethod: "cod",
        subtotal: orderData.subtotal,
        shippingFee: orderData.shipping || 0,
        discount: 0,
        total: orderData.total,
        currency: orderData.currency || "EGP",
        guestName: orderData.customerName,
        guestPhone: orderData.shippingAddress.phone || "",
        guestEmail: orderData.customerEmail || null,
        governorate: orderData.shippingAddress.state,
        city: orderData.shippingAddress.city,
        addressLine: orderData.shippingAddress.line1,
        buildingFloorApt: orderData.shippingAddress.line2 || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const insertedLineItems: (typeof orderLineItems.$inferSelect)[] = []
    for (const item of orderData.items) {
      const [insertedItem] = await db
        .insert(orderLineItems)
        .values({
          id: crypto.randomUUID(),
          orderId: newOrderId,
          productId: item.productId || null,
          variantId: item.variantId || null,
          productName: item.name,
          variantTitle: item.variantName || "",
          sku: item.sku || "",
          imageUrl: item.image?.url || null,
          price: item.price,
          quantity: item.quantity,
          total: item.total || item.price * item.quantity,
        })
        .returning()
      insertedLineItems.push(insertedItem)
    }

    // Status history
    await db.insert(orderStatusHistory).values({
      id: crypto.randomUUID(),
      orderId: newOrderId,
      fromStatus: null,
      toStatus: createdOrder.status,
      note: "تم إنشاء الطلب بنجاح (الدفع عند الاستلام)",
      createdAt: now,
    })

    // Payment record
    await db.insert(paymentRecords).values({
      id: crypto.randomUUID(),
      orderId: newOrderId,
      provider: "cod",
      method: "cod",
      status: "pending",
      amount: createdOrder.total,
      currency: createdOrder.currency,
      createdAt: now,
    })

    return mapDbOrderToDomain(createdOrder, insertedLineItems)
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error(`Order ${id} not found`)
    }

    const [updated] = await db
      .update(orders)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    // Record status history
    await db.insert(orderStatusHistory).values({
      id: crypto.randomUUID(),
      orderId: id,
      fromStatus: existing.status,
      toStatus: status,
      note: `تم تغيير حالة الطلب إلى ${status}`,
      createdAt: new Date(),
    })

    const itemsRows = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, id))
    return mapDbOrderToDomain(updated, itemsRows)
  },
}
