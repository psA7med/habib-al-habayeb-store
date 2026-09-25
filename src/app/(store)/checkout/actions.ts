"use server"

import { z } from "zod"
import { db } from "@/db"
import {
  orders,
  orderLineItems,
  orderStatusHistory,
  paymentRecords,
  productVariants,
  products,
  siteSettings,
} from "@/db/schema"
import { inArray, eq, sql } from "drizzle-orm"

import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

const checkoutSchema = z.object({
  fullName: z.string().min(2, "الاسم بالكامل مطلوب"),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  email: z.string().email().optional().or(z.literal("")),
  governorate: z.string().min(2, "المحافظة مطلوبة"),
  city: z.string().min(2, "المدينة / المركز مطلوب"),
  address: z.string().min(5, "العنوان التفصيلي مطلوب"),
  buildingFloorApt: z.string().optional().default(""),
  deliveryNotes: z.string().optional().default(""),
  items: z.array(
    z.object({
      variantId: z.string(),
      quantity: z.number().int().min(1),
    })
  ).min(1, "سلة المشتريات فارغة"),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

export async function createCodOrderAction(data: CheckoutFormData) {
  // Enforce server-side rate limit per client IP
  await assertRateLimit(
    RateLimits.CHECKOUT.action,
    RateLimits.CHECKOUT.limit,
    RateLimits.CHECKOUT.windowSeconds,
    undefined,
    RateLimits.CHECKOUT.errorMessage
  )

  const validated = checkoutSchema.parse(data)

  const variantIds = validated.items.map((i) => i.variantId)

  // 1. Fetch live prices & product data from database (DO NOT trust client prices)
  const dbVariants = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds))

  if (dbVariants.length === 0) {
    throw new Error("لم يتم العثور على المنتجات المطلوبة في قاعدة البيانات.")
  }

  const productIds = dbVariants.map((v) => v.productId)
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))
  const variantMap = new Map(dbVariants.map((v) => [v.id, v]))

  // 2. Fetch site settings for delivery fee calculation
  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1)

  // 3. Calculate subtotal on server
  let subtotal = 0
  const calculatedItems: Array<{
    variantId: string
    productId: string
    productName: string
    variantTitle: string
    sku: string
    price: number // piasters
    quantity: number
    total: number
  }> = []

  for (const requestedItem of validated.items) {
    const variant = variantMap.get(requestedItem.variantId)
    if (!variant) continue

    const prod = productMap.get(variant.productId)
    const linePrice = variant.price // in piasters
    const lineTotal = linePrice * requestedItem.quantity
    subtotal += lineTotal

    calculatedItems.push({
      variantId: variant.id,
      productId: variant.productId,
      productName: prod?.nameAr || variant.nameAr,
      variantTitle: variant.nameAr,
      sku: variant.sku,
      price: linePrice,
      quantity: requestedItem.quantity,
      total: lineTotal,
    })
  }

  // Delivery fee calculation
  let shippingFee = settings?.standardDeliveryFee || 0
  if (
    settings?.freeDeliveryThreshold &&
    subtotal >= settings.freeDeliveryThreshold
  ) {
    shippingFee = 0
  }

  const total = subtotal + shippingFee
  const now = new Date()
  const orderId = crypto.randomUUID()
  const orderNumber = `HAB-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  // 4. Insert Order
  await db.insert(orders).values({
    id: orderId,
    orderNumber,
    customerId: null, // Guest checkout
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "cod",
    subtotal,
    shippingFee,
    discount: 0,
    total,
    currency: "EGP",
    guestName: validated.fullName,
    guestPhone: validated.phone,
    guestEmail: validated.email || null,
    governorate: validated.governorate,
    city: validated.city,
    addressLine: validated.address,
    buildingFloorApt: validated.buildingFloorApt || null,
    deliveryNotes: validated.deliveryNotes || null,
    createdAt: now,
    updatedAt: now,
  })

  // 5. Insert Line Items
  for (const item of calculatedItems) {
    await db.insert(orderLineItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantTitle: item.variantTitle,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    })

    // Safe inventory decrement (prevent negative stock)
    try {
      await db
        .update(productVariants)
        .set({
          quantity: sql`GREATEST(0, ${productVariants.quantity} - ${item.quantity})`,
          updatedAt: now,
        })
        .where(eq(productVariants.id, item.variantId))
    } catch (invErr) {
      console.warn("Could not decrement inventory:", invErr)
    }
  }

  // 6. Insert Order Status History
  await db.insert(orderStatusHistory).values({
    id: crypto.randomUUID(),
    orderId,
    fromStatus: null,
    toStatus: "pending",
    note: "تم استلام الطلب بنجاح (الدفع عند الاستلام)",
    createdAt: now,
  })

  // 7. Insert Payment Record
  await db.insert(paymentRecords).values({
    id: crypto.randomUUID(),
    orderId,
    provider: "cod",
    method: "cod",
    status: "pending",
    amount: total,
    currency: "EGP",
    createdAt: now,
  })

  return {
    success: true,
    orderId,
    orderNumber,
    totalEgp: (total / 100).toFixed(2),
  }
}
