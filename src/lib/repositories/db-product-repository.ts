import type {
  Product,
  ProductFilters,
  ProductRepository,
  SortOption,
  PaginationParams,
  PaginatedResult,
  ProductVariant,
  ProductImage,
} from "@/types"
import { db } from "@/db"
import {
  products,
  productVariants,
  productImages,
  productCategories,
  categories,
  brands,
} from "@/db/schema"
import { eq, and, or, ilike, sql, desc, asc, inArray, gte, lte } from "drizzle-orm"
import { jsonProductRepository } from "./json-product-repository"

function isJsonFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_JSON_FALLBACK === "true"
}

function mapDbProductToDomain(
  row: typeof products.$inferSelect,
  variantsList: (typeof productVariants.$inferSelect)[] = [],
  imagesList: (typeof productImages.$inferSelect)[] = [],
  categoryIdsList: string[] = []
): Product {
  const mappedVariants: ProductVariant[] = variantsList.map((v) => ({
    id: v.id,
    productId: v.productId,
    sku: v.sku,
    name: v.nameAr,
    price: v.price, // in piasters
    compareAtPrice: v.compareAtPrice ?? undefined,
    currency: v.currency,
    inventory: {
      quantity: v.quantity,
      trackInventory: v.trackInventory,
      allowBackorder: v.allowBackorder,
    },
    options: [],
    images: [],
    weight: v.weight ?? undefined,
  }))

  const mappedImages: ProductImage[] = imagesList
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({
      url: img.url,
      alt: img.altAr || row.nameAr,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    }))

  return {
    id: row.id,
    name: row.nameAr,
    slug: row.slug,
    description: row.descriptionAr || "",
    body: row.bodyAr ?? undefined,
    images: mappedImages,
    status: row.status as "draft" | "active" | "archived",
    brandId: row.brandId || "",
    categoryIds: categoryIdsList,
    tags: row.tags || [],
    variants: mappedVariants,
    rating: row.ratingAvg,
    reviewCount: row.reviewCount,
    featured: row.isFeatured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const dbProductRepository: ProductRepository = {
  async list(filters, sort, pagination): Promise<PaginatedResult<Product>> {
    try {
      const page = Math.max(1, pagination?.page ?? 1)
      const limit = Math.min(100, Math.max(1, pagination?.limit ?? 12))
      const offset = (page - 1) * limit

      // Base condition: active products for storefront
      const conditions = [eq(products.status, "active")]

      if (filters?.search) {
        const term = `%${filters.search.trim()}%`
        conditions.push(
          or(
            ilike(products.nameAr, term),
            ilike(products.nameEn, term),
            ilike(products.descriptionAr, term)
          )!
        )
      }

      if (filters?.category) {
        const cat = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, filters.category))
          .limit(1)

        if (cat.length > 0) {
          const matchingProds = await db
            .select({ productId: productCategories.productId })
            .from(productCategories)
            .where(eq(productCategories.categoryId, cat[0].id))

          const ids = matchingProds.map((p) => p.productId)
          if (ids.length === 0) {
            return {
              items: [],
              pagination: { total: 0, page, limit, totalPages: 0, hasNext: false, hasPrev: false },
            }
          }
          conditions.push(inArray(products.id, ids))
        }
      }

      const whereClause = and(...conditions)

      // Count query
      const [countRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(whereClause)

      const total = countRes?.count ?? 0
      const totalPages = Math.ceil(total / limit)

      if (total === 0) {
        return {
          items: [],
          pagination: { total: 0, page, limit, totalPages: 0, hasNext: false, hasPrev: false },
        }
      }

      // Order query
      let orderBy = [desc(products.createdAt)]
      if (sort) {
        if (sort.field === "name") {
          orderBy = [sort.order === "asc" ? asc(products.nameAr) : desc(products.nameAr)]
        } else if (sort.field === "createdAt") {
          orderBy = [sort.order === "asc" ? asc(products.createdAt) : desc(products.createdAt)]
        }
      }

      const rows = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)

      const productIds = rows.map((r) => r.id)
      if (productIds.length === 0) {
        return {
          items: [],
          pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        }
      }

      // Fetch variants, images, and category mappings
      const [variantsRows, imagesRows, catRows] = await Promise.all([
        db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
        db.select().from(productImages).where(inArray(productImages.productId, productIds)),
        db.select().from(productCategories).where(inArray(productCategories.productId, productIds)),
      ])

      const items: Product[] = rows.map((row) => {
        const pVariants = variantsRows.filter((v) => v.productId === row.id)
        const pImages = imagesRows.filter((img) => img.productId === row.id)
        const pCats = catRows.filter((c) => c.productId === row.id).map((c) => c.categoryId)
        return mapDbProductToDomain(row, pVariants, pImages, pCats)
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
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Product query failed, falling back to JSON:", error)
        return jsonProductRepository.list(filters, sort, pagination)
      }
      console.error("DB Product query failed:", error)
      throw error
    }
  },

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const [row] = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.status, "active")))
        .limit(1)

      if (!row) {
        if (isJsonFallbackAllowed()) {
          return jsonProductRepository.getBySlug(slug)
        }
        return null
      }

      const [variantsRows, imagesRows, catRows] = await Promise.all([
        db.select().from(productVariants).where(eq(productVariants.productId, row.id)),
        db.select().from(productImages).where(eq(productImages.productId, row.id)),
        db.select().from(productCategories).where(eq(productCategories.productId, row.id)),
      ])

      return mapDbProductToDomain(
        row,
        variantsRows,
        imagesRows,
        catRows.map((c) => c.categoryId)
      )
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Product getBySlug failed, falling back to JSON:", error)
        return jsonProductRepository.getBySlug(slug)
      }
      console.error("DB Product getBySlug failed:", error)
      throw error
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const [row] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1)

      if (!row) {
        if (isJsonFallbackAllowed()) {
          return jsonProductRepository.getById(id)
        }
        return null
      }

      const [variantsRows, imagesRows, catRows] = await Promise.all([
        db.select().from(productVariants).where(eq(productVariants.productId, row.id)),
        db.select().from(productImages).where(eq(productImages.productId, row.id)),
        db.select().from(productCategories).where(eq(productCategories.productId, row.id)),
      ])

      return mapDbProductToDomain(
        row,
        variantsRows,
        imagesRows,
        catRows.map((c) => c.categoryId)
      )
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Product getById failed, falling back to JSON:", error)
        return jsonProductRepository.getById(id)
      }
      console.error("DB Product getById failed:", error)
      throw error
    }
  },

  async getFeatured(limit = 4): Promise<Product[]> {
    try {
      const rows = await db
        .select()
        .from(products)
        .where(and(eq(products.isFeatured, true), eq(products.status, "active")))
        .limit(limit)

      if (rows.length === 0) {
        if (isJsonFallbackAllowed()) {
          return jsonProductRepository.getFeatured(limit)
        }
        return []
      }

      const productIds = rows.map((r) => r.id)
      const [variantsRows, imagesRows, catRows] = await Promise.all([
        db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
        db.select().from(productImages).where(inArray(productImages.productId, productIds)),
        db.select().from(productCategories).where(inArray(productCategories.productId, productIds)),
      ])

      return rows.map((row) =>
        mapDbProductToDomain(
          row,
          variantsRows.filter((v) => v.productId === row.id),
          imagesRows.filter((img) => img.productId === row.id),
          catRows.filter((c) => c.productId === row.id).map((c) => c.categoryId)
        )
      )
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Product getFeatured failed, falling back to JSON:", error)
        return jsonProductRepository.getFeatured(limit)
      }
      console.error("DB Product getFeatured failed:", error)
      throw error
    }
  },

  async getByCategory(categorySlug: string, pagination?: PaginationParams): Promise<PaginatedResult<Product>> {
    return this.list({ category: categorySlug }, undefined, pagination)
  },

  async search(query: string, pagination?: PaginationParams): Promise<PaginatedResult<Product>> {
    return this.list({ search: query }, undefined, pagination)
  },
}
