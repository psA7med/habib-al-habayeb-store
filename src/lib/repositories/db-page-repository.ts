import type { CmsPage } from "@/types"
import { jsonPageRepository } from "./json-page-repository"

export const dbPageRepository = {
  async list(): Promise<CmsPage[]> {
    return jsonPageRepository.list()
  },

  async getBySlug(slug: string): Promise<CmsPage | null> {
    return jsonPageRepository.getBySlug(slug)
  },

  async getById(id: string): Promise<CmsPage | null> {
    return jsonPageRepository.getById(id)
  },
}
