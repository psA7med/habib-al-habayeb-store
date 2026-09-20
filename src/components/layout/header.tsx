"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Heart } from "lucide-react"
import { SearchInput } from "@/components/search/search-input"
import { WishlistDrawer } from "@/components/layout/wishlist-drawer"
import { siteConfig } from "@/lib/config"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"

interface HeaderProps {
  categories?: never // Not used in this simplified header
}

export function Header({}: HeaderProps) {
  const t = useTranslations("nav")
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const openCart = useCartStore((s) => s.openCart)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const wishlistItems = useWishlistStore((s) => s.items)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const itemCount = mounted ? getItemCount() : 0
  const wishlistCount = mounted ? wishlistItems.length : 0

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* MOBILE: Left — Cart + Wishlist */}
          <div className="flex lg:hidden gap-2">
            {/* Cart */}
            <button
              onClick={openCart}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent transition-colors"
              aria-label={t("openCart")}
            >
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 text-foreground" />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </button>
          </div>

          {/* Logo — Left on desktop, centered on mobile */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={140}
              height={44}
              priority
              className="h-11 w-auto"
            />
          </Link>

          {/* DESKTOP: Center — Large Search Bar */}
          <div className="hidden lg:flex flex-1 justify-center px-8 relative z-[60] overflow-visible">
            <div className="w-full max-w-md relative overflow-visible">
              <SearchInput />
            </div>
          </div>

          {/* DESKTOP: Right — Wishlist + Cart */}
          <div className="hidden lg:flex gap-4 items-center flex-shrink-0">
            {/* Wishlist */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent transition-colors group"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent transition-colors group"
              aria-label={t("openCart")}
            >
              <ShoppingBag className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>

          {/* MOBILE: Right — Search */}
          <div className="lg:hidden flex-1 max-w-xs">
            <SearchInput />
          </div>
        </div>
      </header>

      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  )
}
