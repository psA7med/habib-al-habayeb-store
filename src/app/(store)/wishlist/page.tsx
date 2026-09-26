"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingBag } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { useWishlistStore } from "@/store/wishlist"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { toast } from "sonner"

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((s) => s.items)
  const removeItem = useWishlistStore((s) => s.removeItem)
  const clearAll = useWishlistStore((s) => s.clearAll)
  const addToCart = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="قائمة الرغبات" />
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="قائمة الرغبات" />
        <EmptyState
          icon={Heart}
          title="قائمة الرغبات فارغة"
          description="احفظ المنتجات التي تعجبك لتصل إليها بسهولة لاحقاً."
          actionLabel="تصفح المنتجات"
          actionHref="/shop"
        />
      </div>
    )
  }

  function handleAddToCart(item: (typeof wishlistItems)[0]) {
    addToCart({
      variantId: item.productId,
      productId: item.productId,
      name: item.name,
      variantName: item.name,
      image: item.image ?? { url: PLACEHOLDER_IMAGE, alt: item.name },
      slug: item.slug,
      price: item.price,
      quantity: 1,
    })
    openCart()
    toast.success("تمت إضافة المنتج إلى السلة")
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="قائمة الرغبات"
          description={`${wishlistItems.length} ${wishlistItems.length === 1 ? "منتج" : "منتجات"}`}
        />
        {wishlistItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-neutral-500 hover:text-red-600"
          >
            مسح الكل
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {wishlistItems.map((item) => (
          <div
            key={item.productId}
            className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <Link href={`/${item.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <Image
                    src={item.image?.url || PLACEHOLDER_IMAGE}
                    alt={item.image?.alt || item.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-neutral-900 line-clamp-2 hover:underline">
                  {item.name}
                </h3>
              </Link>
              <p className="mt-1 text-sm font-bold text-neutral-900">
                {formatPrice(item.price, "EGP")}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-neutral-100">
              <Button
                size="sm"
                className="flex-1 bg-neutral-900 text-white text-xs hover:bg-neutral-800"
                onClick={() => handleAddToCart(item)}
              >
                <ShoppingBag className="ml-1 h-3.5 w-3.5" />
                أضف للسلة
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  removeItem(item.productId)
                  toast("تم الحذف من المفضلة")
                }}
                aria-label="حذف من المفضلة"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
