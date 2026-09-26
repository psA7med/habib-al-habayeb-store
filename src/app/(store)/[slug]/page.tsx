import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  getCachedProductBySlug,
  getCachedCategoryBySlug,
  getCachedCategoryById,
  getCachedCategoryAncestors,
  getCachedCategoryChildren,
  getCachedProductsByCategory,
  getCachedProducts,
  getCachedCategories,
  getCachedBrands,
  getCachedBrandBySlug,
  getCachedBrandById,
} from "@/lib/repositories/cached"
import { ProductDetailView } from "./product-detail-view"
import { CategoryView } from "./category-view"
import { BrandView } from "./brand-view"
import { formatPrice } from "@/lib/utils"
import { siteConfig } from "@/lib/config"
import data from "@/data/products.json"
import type { Product, Category, Brand } from "@/types"

interface SlugPageProps {
  params: Promise<{ slug: string }>
}

// Allow dynamic slugs so products, categories, and brands added or edited
// in the live database are served immediately without requiring a full rebuild.
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const [productsRes, categoriesList, brandsList] = await Promise.all([
      getCachedProducts(undefined, undefined, { page: 1, limit: 100 }).catch(() => ({ items: [] as Product[] })),
      getCachedCategories().catch(() => [] as Category[]),
      getCachedBrands().catch(() => [] as Brand[]),
    ])

    const productSlugs = productsRes.items.map((p: Product) => ({ slug: p.slug }))
    const categorySlugs = categoriesList.map((c: Category) => ({ slug: c.slug }))
    const brandSlugs = brandsList.map((b: Brand) => ({ slug: b.slug }))

    if (productSlugs.length > 0 || categorySlugs.length > 0) {
      return [...productSlugs, ...categorySlugs, ...brandSlugs]
    }
  } catch (err) {
    console.warn("generateStaticParams fallback to static data:", err)
  }

  const productSlugs = data.products
    .filter((p) => p.status === "active")
    .map((p) => ({ slug: p.slug }))
  const categorySlugs = data.categories.map((c) => ({ slug: c.slug }))
  const brandSlugs = (data as { brands?: { slug: string }[] }).brands?.map(
    (b) => ({ slug: b.slug })
  ) ?? []

  return [...productSlugs, ...categorySlugs, ...brandSlugs]
}

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params

  const product = await getCachedProductBySlug(slug)
  if (product) {
    const variant = product.variants[0]
    const price = variant ? formatPrice(variant.price, variant.currency) : ""
    return {
      title: product.name,
      description: product.description,
      alternates: { canonical: `/${product.slug}` },
      openGraph: {
        title: product.name,
        description: product.description,
        type: "website",
        url: `${siteConfig.url}/${product.slug}`,
        images: product.images[0]
          ? [{ url: product.images[0].url, alt: product.images[0].alt }]
          : [],
      },
      other: {
        "product:price:amount": variant
          ? String(variant.price / 100)
          : "",
        "product:price:currency": variant?.currency ?? "USD",
      },
    }
  }

  const category = await getCachedCategoryBySlug(slug)
  if (category) {
    return {
      title: category.name,
      description: category.description,
      alternates: { canonical: `/${category.slug}` },
      openGraph: {
        title: category.name,
        description: category.description,
        type: "website",
        url: `${siteConfig.url}/${category.slug}`,
      },
    }
  }

  const brand = await getCachedBrandBySlug(slug)
  if (brand) {
    return {
      title: brand.name,
      description: brand.description,
      alternates: { canonical: `/${brand.slug}` },
      openGraph: {
        title: brand.name,
        description: brand.description,
        type: "website",
        url: `${siteConfig.url}/${brand.slug}`,
      },
    }
  }

  return { title: "Not Found" }
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params

  // Check product first
  const product = await getCachedProductBySlug(slug)
  if (product) {
    // Pick the most specific category (prefer one with a parentId, i.e. a subcategory)
    const productCategories = await Promise.all(
      product.categoryIds.map((id) => getCachedCategoryById(id))
    )
    const validCategories = productCategories.filter(
      (c): c is NonNullable<typeof c> => c !== null
    )
    const primaryCategory =
      validCategories.find((c) => c.parentId) ?? validCategories[0] ?? null

    const [relatedProducts, brand, categoryAncestors] = await Promise.all([
      primaryCategory
        ? getCachedProductsByCategory(primaryCategory.slug, { page: 1, limit: 5 })
            .then((r) => r.items.filter((p) => p.id !== product.id).slice(0, 4))
        : Promise.resolve([]),
      product.brandId ? getCachedBrandById(product.brandId) : Promise.resolve(null),
      primaryCategory
        ? getCachedCategoryAncestors(primaryCategory.id)
        : Promise.resolve([]),
    ])

    return (
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        brand={brand}
        categoryAncestors={categoryAncestors}
      />
    )
  }

  // Check category
  const category = await getCachedCategoryBySlug(slug)
  if (category) {
    const [{ items: products, pagination }, subcategories, ancestors] =
      await Promise.all([
        getCachedProductsByCategory(slug, { page: 1, limit: 40 }),
        getCachedCategoryChildren(category.id),
        getCachedCategoryAncestors(category.id),
      ])
    return (
      <CategoryView
        category={category}
        products={products}
        pagination={pagination}
        subcategories={subcategories}
        ancestors={ancestors}
      />
    )
  }

  // Check brand
  const brand = await getCachedBrandBySlug(slug)
  if (brand) {
    const { items: products, pagination } = await getCachedProducts(
      { tags: [] },
      undefined,
      { page: 1, limit: 40 }
    )
    const brandProducts = products.filter((p) => p.brandId === brand.id)
    return (
      <BrandView
        brand={brand}
        products={brandProducts}
        pagination={{ ...pagination, total: brandProducts.length, totalPages: 1, hasNext: false }}
      />
    )
  }

  notFound()
}
