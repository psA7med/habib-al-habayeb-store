import type { BlogPost, PaginatedResult, PaginationParams } from "@/types"
import { jsonBlogRepository } from "./json-blog-repository"

export const dbBlogRepository = {
  async list(params?: PaginationParams): Promise<PaginatedResult<BlogPost>> {
    return jsonBlogRepository.list(params)
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    return jsonBlogRepository.getBySlug(slug)
  },

  async getByTag(
    tag: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<BlogPost>> {
    return jsonBlogRepository.getByTag(tag, params)
  },
}
