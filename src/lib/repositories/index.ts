// ============================================================================
// Database-backed Repositories — Habib Al-Habayeb
// ============================================================================
// Exports database implementations backed by Supabase PostgreSQL and Drizzle ORM.

export { dbProductRepository as productRepository } from "./db-product-repository"
export { dbCategoryRepository as categoryRepository } from "./db-category-repository"
export { dbBrandRepository as brandRepository } from "./db-brand-repository"
export { dbPageRepository as pageRepository } from "./db-page-repository"
export { dbBlogRepository as blogRepository } from "./db-blog-repository"
export { dbOrderRepository as orderRepository } from "./db-order-repository"
