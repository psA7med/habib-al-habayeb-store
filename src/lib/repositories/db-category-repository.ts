import type { Category, CategoryRepository } from "@/types"
import { db } from "@/db"
import { categories } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { jsonCategoryRepository } from "./json-category-repository"

function isJsonFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_JSON_FALLBACK === "true"
}

function mapDbCategoryToDomain(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.nameAr,
    slug: row.slug,
    description: row.descriptionAr || "",
    image: row.imageUrl
      ? {
          url: row.imageUrl,
          alt: row.imageAlt || row.nameAr,
        }
      : undefined,
    parentId: row.parentId ?? undefined,
    order: row.sortOrder,
  }
}

export const dbCategoryRepository: CategoryRepository & {
  getChildren(parentId: string): Promise<Category[]>
  getTopLevel(): Promise<Category[]>
  getAncestors(categoryId: string): Promise<Category[]>
} = {
  async list(): Promise<Category[]> {
    try {
      const rows = await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder))

      if (rows.length === 0) {
        if (isJsonFallbackAllowed()) {
          return jsonCategoryRepository.list()
        }
        return []
      }

      return rows.map(mapDbCategoryToDomain)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Category list failed, falling back to JSON:", error)
        return jsonCategoryRepository.list()
      }
      console.error("DB Category list failed:", error)
      throw error
    }
  },

  async getBySlug(slug: string): Promise<Category | null> {
    try {
      const [row] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1)

      if (!row) {
        if (isJsonFallbackAllowed()) {
          return jsonCategoryRepository.getBySlug(slug)
        }
        return null
      }

      return mapDbCategoryToDomain(row)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Category getBySlug failed, falling back to JSON:", error)
        return jsonCategoryRepository.getBySlug(slug)
      }
      console.error("DB Category getBySlug failed:", error)
      throw error
    }
  },

  async getById(id: string): Promise<Category | null> {
    try {
      const [row] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1)

      if (!row) {
        if (isJsonFallbackAllowed()) {
          return jsonCategoryRepository.getById(id)
        }
        return null
      }

      return mapDbCategoryToDomain(row)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Category getById failed, falling back to JSON:", error)
        return jsonCategoryRepository.getById(id)
      }
      console.error("DB Category getById failed:", error)
      throw error
    }
  },

  async getChildren(parentId: string): Promise<Category[]> {
    try {
      const rows = await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, parentId))
        .orderBy(asc(categories.sortOrder))

      if (rows.length === 0) {
        if (isJsonFallbackAllowed()) {
          return jsonCategoryRepository.getChildren(parentId)
        }
        return []
      }

      return rows.map(mapDbCategoryToDomain)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Category getChildren failed, falling back to JSON:", error)
        return jsonCategoryRepository.getChildren(parentId)
      }
      console.error("DB Category getChildren failed:", error)
      throw error
    }
  },

  async getTopLevel(): Promise<Category[]> {
    try {
      const all = await this.list()
      return all.filter((c) => !c.parentId)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        return jsonCategoryRepository.getTopLevel()
      }
      throw error
    }
  },

  async getAncestors(categoryId: string): Promise<Category[]> {
    try {
      const all = await this.list()
      const chain: Category[] = []
      let current = all.find((c) => c.id === categoryId)
      while (current) {
        chain.unshift(current)
        current = current.parentId
          ? all.find((c) => c.id === current!.parentId)
          : undefined
      }
      return chain
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        return jsonCategoryRepository.getAncestors(categoryId)
      }
      throw error
    }
  },
}
