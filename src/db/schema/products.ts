// ============================================================================
// Database Schema — Products, Categories, Brands, Variants, Images
// ============================================================================

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// --- Enums ---

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
])

// --- Brands ---

export const brands = pgTable("brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// --- Categories ---

export const categories = pgTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull().default(""),
    slug: text("slug").notNull().unique(),
    descriptionAr: text("description_ar").notNull().default(""),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    parentId: text("parent_id"), // Self-referencing FK
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_slug_idx").on(table.slug),
  ]
)

// --- Products ---

export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull().default(""),
    slug: text("slug").notNull().unique(),
    descriptionAr: text("description_ar").notNull().default(""),
    bodyAr: text("body_ar"), // Rich details
    brandId: text("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    status: productStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    ratingAvg: real("rating_avg").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    tags: text("tags")
      .array()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_slug_idx").on(table.slug),
    index("products_brand_id_idx").on(table.brandId),
    index("products_status_idx").on(table.status),
    index("products_is_featured_idx").on(table.isFeatured),
  ]
)

// --- Product ↔ Category (M:N) ---

export const productCategories = pgTable(
  "product_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("product_categories_product_id_idx").on(table.productId),
    index("product_categories_category_id_idx").on(table.categoryId),
  ]
)

// --- Product Variants ---

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().default(""),
    barcode: text("barcode"),
    nameAr: text("name_ar").notNull(),
    price: integer("price").notNull(), // in piasters (e.g. 5000 = 50.00 EGP)
    compareAtPrice: integer("compare_at_price"), // in piasters
    currency: text("currency").notNull().default("EGP"),
    trackInventory: boolean("track_inventory").notNull().default(true),
    quantity: integer("quantity").notNull().default(0),
    allowBackorder: boolean("allow_backorder").notNull().default(false),
    weight: real("weight"), // in grams
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_variants_product_id_idx").on(table.productId),
    index("product_variants_sku_idx").on(table.sku),
  ]
)

// --- Product Images ---

export const productImages = pgTable(
  "product_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    mediaFileId: text("media_file_id"), // Optional reference to media_files
    altAr: text("alt_ar").notNull().default(""),
    width: integer("width"),
    height: integer("height"),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_images_product_id_idx").on(table.productId),
    index("product_images_sort_order_idx").on(table.sortOrder),
  ]
)

// --- Relations ---

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parentChild",
  }),
  children: many(categories, { relationName: "parentChild" }),
  productCategories: many(productCategories),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  productCategories: many(productCategories),
}))

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  })
)

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    images: many(productImages),
  })
)

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}))
