// ============================================================================
// Database Schema — Orders, Line Items, Status History, Payment Records
// ============================================================================

import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { profiles } from "./profiles"
import { products, productVariants } from "./products"

// --- Enums ---

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "cod", // Cash on Delivery (MVP primary)
  "card",
  "wallet",
  "other",
])

// --- Orders ---

export const orders = pgTable(
  "orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderNumber: text("order_number").notNull().unique(), // e.g. "HAB-2026-0001"
    
    // Future-proof: nullable customer ID linked to Supabase Auth UUID
    // Customer accounts are NOT required in MVP; guest checkout is default.
    customerId: text("customer_id"),

    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("cod"),

    // Financials in piasters (Egyptian cents, 100 piasters = 1 EGP)
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    currency: text("currency").notNull().default("EGP"),

    // Guest Contact & Egyptian Address Details (Direct snapshot on order)
    guestName: text("guest_name").notNull(),
    guestPhone: text("guest_phone").notNull(),
    guestEmail: text("guest_email"),
    governorate: text("governorate").notNull(), // Egyptian governorate (e.g. القاهرة, الجيزة)
    city: text("city").notNull(),
    addressLine: text("address_line").notNull(),
    buildingFloorApt: text("building_floor_apt"),
    deliveryNotes: text("delivery_notes"),

    // Admin notes
    adminNotes: text("admin_notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_order_number_idx").on(table.orderNumber),
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_guest_phone_idx").on(table.guestPhone),
  ]
)

// --- Order Line Items ---

export const orderLineItems = pgTable(
  "order_line_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),

    // Snapshot at purchase time
    productName: text("product_name").notNull(),
    variantTitle: text("variant_title").notNull().default(""),
    sku: text("sku").notNull().default(""),
    imageUrl: text("image_url"),
    price: integer("price").notNull(), // in piasters
    quantity: integer("quantity").notNull(),
    total: integer("total").notNull(), // in piasters
  },
  (table) => [
    index("order_line_items_order_id_idx").on(table.orderId),
    index("order_line_items_product_id_idx").on(table.productId),
  ]
)

// --- Order Status History (Audit Trail) ---

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedBy: text("changed_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_status_history_order_id_idx").on(table.orderId),
  ]
)

// --- Payment Records ---

export const paymentRecords = pgTable(
  "payment_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("cod"),
    method: paymentMethodEnum("method").notNull().default("cod"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: integer("amount").notNull(), // in piasters
    currency: text("currency").notNull().default("EGP"),
    referenceCode: text("reference_code"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payment_records_order_id_idx").on(table.orderId),
  ]
)

// --- Relations ---

export const ordersRelations = relations(orders, ({ many }) => ({
  lineItems: many(orderLineItems),
  statusHistory: many(orderStatusHistory),
  paymentRecords: many(paymentRecords),
}))

export const orderLineItemsRelations = relations(
  orderLineItems,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderLineItems.orderId],
      references: [orders.id],
    }),
    product: one(products, {
      fields: [orderLineItems.productId],
      references: [products.id],
    }),
    variant: one(productVariants, {
      fields: [orderLineItems.variantId],
      references: [productVariants.id],
    }),
  })
)

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changer: one(profiles, {
      fields: [orderStatusHistory.changedBy],
      references: [profiles.id],
    }),
  })
)

export const paymentRecordsRelations = relations(
  paymentRecords,
  ({ one }) => ({
    order: one(orders, {
      fields: [paymentRecords.orderId],
      references: [orders.id],
    }),
  })
)
