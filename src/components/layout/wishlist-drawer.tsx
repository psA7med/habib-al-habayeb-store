"use client"

import { Heart, X, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useWishlistStore } from "@/store/wishlist"
import { formatPrice } from "@/lib/utils"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { useState, useEffect } from "react"

interface WishlistDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const wishlistItems = useWishlistStore((s) => s.items)
  const removeItem = useWishlistStore((s) => s.removeItem)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[100] h-full w-full max-w-sm bg-white shadow-lg flex flex-col max-sm:max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Wishlist
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-neutral-100 transition-colors"
            aria-label="Close wishlist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Your wishlist is empty
              </p>
              <Link
                href="/shop"
                onClick={onClose}
                className="text-primary hover:underline text-sm font-medium"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {wishlistItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-lg border border-border p-3 hover:bg-neutral-50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                    <Image
                      src={item.image?.url ?? PLACEHOLDER_IMAGE}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${item.slug}`}
                      onClick={onClose}
                      className="block text-sm font-medium text-foreground hover:text-primary truncate transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {formatPrice(item.price, "EGP")}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistItems.length > 0 && (
          <div className="border-t px-4 py-4">
            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
