import type { Brand } from "@/types"
import { db } from "@/db"
import { brands } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { jsonBrandRepository } from "./json-brand-repository"

function isJsonFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_JSON_FALLBACK === "true"
}

function mapDbBrandToDomain(row: typeof brands.$inferSelect): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
  }
}

export const dbBrandRepository = {
  async list(): Promise<Brand[]> {
    try {
      const rows = await db
        .select()
        .from(brands)
        .where(eq(brands.isActive, true))
        .orderBy(asc(brands.name))

      if (rows.length === 0) {
        if (isJsonFallbackAllowed()) {
          return jsonBrandRepository.list()
        }
        return []
      }

      return rows.map(mapDbBrandToDomain)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Brand list failed, falling back to JSON:", error)
        return jsonBrandRepository.list()
      }
      console.error("DB Brand list failed:", error)
      throw error
    }
  },

  async getBySlug(slug: string): Promise<Brand | null> {
    try {
      const [row] = await db
        .select()
        .from(brands)
        .where(eq(brands.slug, slug))
        .limit(1)

      if (!row) {
        if (isJsonFallbackAllowed()) {
          return jsonBrandRepository.getBySlug(slug)
        }
        return null
      }

      return mapDbBrandToDomain(row)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Brand getBySlug failed, falling back to JSON:", error)
        return jsonBrandRepository.getBySlug(slug)
      }
      console.error("DB Brand getBySlug failed:", error)
      throw error
    }
  },

  async getById(id: string): Promise<Brand | null> {
    try {
      const [row] = await db
        .select()
        .from(brands)
        .where(eq(brands.id, id))
        .limit(1)

      if (!row) {
        if (isJsonFallbackAllowed()) {
          return jsonBrandRepository.getById(id)
        }
        return null
      }

      return mapDbBrandToDomain(row)
    } catch (error) {
      if (isJsonFallbackAllowed()) {
        console.warn("[DEV ONLY] DB Brand getById failed, falling back to JSON:", error)
        return jsonBrandRepository.getById(id)
      }
      console.error("DB Brand getById failed:", error)
      throw error
    }
  },
}
