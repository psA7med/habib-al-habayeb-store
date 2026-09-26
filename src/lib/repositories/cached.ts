// ============================================================================
// Cached Data Access — Habib Al-Habayeb
// ============================================================================
// Wraps repository read methods with `unstable_cache` for time-based caching
// with tag-based invalidation. This avoids a fresh DB round-trip on every
// page navigation while still allowing instant invalidation on mutations.
//
// Usage: Import cached* functions in Server Components / pages.
//        Call revalidateTag("products") etc. in server actions after mutations.

import { unstable_cache } from "next/cache"
import { dbProductRepository } from "./db-product-repository"
import { dbCategoryRepository } from "./db-category-repository"
import { dbBrandRepository } from "./db-brand-repository"
import { dbPageRepository } from "./db-page-repository"
import { dbBlogRepository } from "./db-blog-repository"
import type { ProductFilters, SortOption, PaginationParams } from "@/types"

// ── Revalidation windows ─────────────────────────────────────────────
// Store-facing data uses a 2-minute stale window. Admin pages are
// force-dynamic so they always re-fetch, but benefit from React's
// per-render request deduplication (via `cache` from React) instead.
const STORE_REVALIDATE = 120 // seconds

// ── Categories ───────────────────────────────────────────────────────
export const getCachedCategories = unstable_cache(
  async () => dbCategoryRepository.list(),
  ["categories-list"],
  { tags: ["categories"], revalidate: STORE_REVALIDATE }
)

export const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => dbCategoryRepository.getBySlug(slug),
  ["category-by-slug"],
  { tags: ["categories"], revalidate: STORE_REVALIDATE }
)

export const getCachedCategoryById = unstable_cache(
  async (id: string) => dbCategoryRepository.getById(id),
  ["category-by-id"],
  { tags: ["categories"], revalidate: STORE_REVALIDATE }
)

export const getCachedTopLevelCategories = unstable_cache(
  async () => dbCategoryRepository.getTopLevel(),
  ["categories-top-level"],
  { tags: ["categories"], revalidate: STORE_REVALIDATE }
)

export const getCachedCategoryAncestors = unstable_cache(
  async (categoryId: string) => dbCategoryRepository.getAncestors(categoryId),
  ["category-ancestors"],
  { tags: ["categories"], revalidate: STORE_REVALIDATE }
)

export const getCachedCategoryChildren = unstable_cache(
  async (parentId: string) => dbCategoryRepository.getChildren(parentId),
  ["category-children"],
  { tags: ["categories"], revalidate: STORE_REVALIDATE }
)

// ── Products ─────────────────────────────────────────────────────────
export const getCachedProducts = unstable_cache(
  async (
    filters?: ProductFilters,
    sort?: SortOption,
    pagination?: PaginationParams
  ) => dbProductRepository.list(filters, sort, pagination),
  ["products-list"],
  { tags: ["products"], revalidate: STORE_REVALIDATE }
)

export const getCachedProductBySlug = unstable_cache(
  async (slug: string) => dbProductRepository.getBySlug(slug),
  ["product-by-slug"],
  { tags: ["products"], revalidate: STORE_REVALIDATE }
)

export const getCachedFeaturedProducts = unstable_cache(
  async (limit = 4) => dbProductRepository.getFeatured(limit),
  ["products-featured"],
  { tags: ["products"], revalidate: STORE_REVALIDATE }
)

export const getCachedProductsByCategory = unstable_cache(
  async (categorySlug: string, pagination?: PaginationParams) =>
    dbProductRepository.getByCategory(categorySlug, pagination),
  ["products-by-category"],
  { tags: ["products", "categories"], revalidate: STORE_REVALIDATE }
)

export const getCachedProductSearch = unstable_cache(
  async (query: string, pagination?: PaginationParams) =>
    dbProductRepository.search(query, pagination),
  ["products-search"],
  { tags: ["products"], revalidate: 60 } // shorter cache for search
)

// ── Brands ───────────────────────────────────────────────────────────
export const getCachedBrands = unstable_cache(
  async () => dbBrandRepository.list(),
  ["brands-list"],
  { tags: ["brands"], revalidate: STORE_REVALIDATE }
)

export const getCachedBrandBySlug = unstable_cache(
  async (slug: string) => dbBrandRepository.getBySlug(slug),
  ["brand-by-slug"],
  { tags: ["brands"], revalidate: STORE_REVALIDATE }
)

export const getCachedBrandById = unstable_cache(
  async (id: string) => dbBrandRepository.getById(id),
  ["brand-by-id"],
  { tags: ["brands"], revalidate: STORE_REVALIDATE }
)

// ── Pages ────────────────────────────────────────────────────────────
export const getCachedPages = unstable_cache(
  async () => dbPageRepository.list(),
  ["pages-list"],
  { tags: ["pages"], revalidate: STORE_REVALIDATE }
)

export const getCachedPageBySlug = unstable_cache(
  async (slug: string) => dbPageRepository.getBySlug(slug),
  ["page-by-slug"],
  { tags: ["pages"], revalidate: STORE_REVALIDATE }
)

// ── Blog ─────────────────────────────────────────────────────────────
export const getCachedBlogPosts = unstable_cache(
  async (params?: PaginationParams) => dbBlogRepository.list(params),
  ["blog-list"],
  { tags: ["blog"], revalidate: STORE_REVALIDATE }
)

export const getCachedBlogPostBySlug = unstable_cache(
  async (slug: string) => dbBlogRepository.getBySlug(slug),
  ["blog-by-slug"],
  { tags: ["blog"], revalidate: STORE_REVALIDATE }
)
