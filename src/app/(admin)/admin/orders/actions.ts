"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { orders, orderStatusHistory, paymentRecords } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/supabase/auth"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

const validStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: (typeof validStatuses)[number],
  note?: string
) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )

  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!existingOrder) {
    throw new Error("الطلب غير موجود")
  }

  const now = new Date()

  // 1. Update order status
  await db
    .update(orders)
    .set({
      status: newStatus,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId))

  // 2. Add status history audit record
  await db.insert(orderStatusHistory).values({
    id: crypto.randomUUID(),
    orderId,
    fromStatus: existingOrder.status,
    toStatus: newStatus,
    changedBy: admin.id,
    note: note || `تم تغيير حالة الطلب بواسطة ${admin.fullName}`,
    createdAt: now,
  })

  // If marked delivered, update payment status to paid for COD
  if (newStatus === "delivered" && existingOrder.paymentMethod === "cod") {
    await db
      .update(orders)
      .set({ paymentStatus: "paid" })
      .where(eq(orders.id, orderId))

    await db
      .update(paymentRecords)
      .set({ status: "paid" })
      .where(eq(paymentRecords.orderId, orderId))
  }

  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}

export async function updateOrderAdminNotesAction(orderId: string, notes: string) {
  const admin = await requireAdmin()
  await assertRateLimit(
    RateLimits.MUTATIONS.action,
    RateLimits.MUTATIONS.limit,
    RateLimits.MUTATIONS.windowSeconds,
    admin.id
  )
  await db
    .update(orders)
    .set({ adminNotes: notes, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}
