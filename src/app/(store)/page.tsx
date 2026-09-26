import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/lib/config"
import { formatPrice } from "@/lib/utils"
import { ProductGrid } from "@/components/products/product-grid"
import { NewsletterForm } from "@/components/layout/newsletter-form"
import { Hero } from "@/components/layout/hero"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { getCachedCategories, getCachedFeaturedProducts } from "@/lib/repositories/cached"

export const metadata: Metadata = {
  title: "حبيب الحبايب - كل احتياجات البيت في مكان واحد",
  description:
    "متجر البقالة الالكترونية الأول في مصر. منتجات طازة وموثوقة بأسعار مناسبة.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "حبيب الحبايب",
    description:
      "متجر البقالة الالكترونية الأول في مصر.",
    type: "website",
    url: siteConfig.url,
  },
  keywords: [
    "متجر بقالة",
    "تسوق اونلاين",
    "مصر",
    "منتجات طازة",
    "توصيل منزلي",
  ],
}

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCachedCategories(),
    getCachedFeaturedProducts(4),
  ])


  return (
    <div className="flex flex-col">
      {/* Hero — static responsive image */}
      <Hero />

      {/* Categories */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Shop by Category
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/${category.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={category.image?.url ?? PLACEHOLDER_IMAGE}
                  alt={category.image?.alt ?? category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 16vw"
                />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-sm font-medium group-hover:underline">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Featured Products
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Join our newsletter
          </h2>
          <p className="mt-4 text-neutral-400">
            Get updates on new arrivals and exclusive offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
