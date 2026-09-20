"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Product } from "@/types"

// Import products data directly at the module level (not lazy)
const allProducts: Product[] = (() => {
  try {
    // Dynamically import to get the products array
    const productsData = require("@/data/products.json")
    return (productsData.products || []) as Product[]
  } catch (e) {
    console.error("[SearchInput] Failed to load products:", e)
    return []
  }
})()

interface SearchInputProps {
  onClose?: () => void
}

export function SearchInput({ onClose }: SearchInputProps) {
  const t = useTranslations("nav")
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const lowerQuery = query.toLowerCase()
    console.log(`[SearchInput] Searching for: "${query}" in ${allProducts.length} products`)

    // Match against name, description, and tags
    const filtered = allProducts
      .filter((p) => p.status === "active")
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 6)

    console.log(`[SearchInput] Found ${filtered.length} matches`)
    setSuggestions(filtered)
    setSelectedIndex(-1)
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([])
      }
    }

    if (suggestions.length > 0) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [suggestions.length])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) {
        if (e.key === "Enter" && query.trim()) {
          window.location.href = `/search?q=${encodeURIComponent(query)}`
        }
        if (e.key === "Escape") {
          setQuery("")
        }
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0) {
            window.location.href = `/${suggestions[selectedIndex].slug}`
          } else if (query.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(query)}`
          }
          break
        case "Escape":
          e.preventDefault()
          setSuggestions([])
          break
      }
    },
    [suggestions, selectedIndex, query]
  )

  const handleSuggestionClick = (slug: string) => {
    window.location.href = `/${slug}`
  }

  const searchUrl = query.trim() ? `/search?q=${encodeURIComponent(query)}` : "#"

  return (
    <div className="w-full" ref={containerRef} role="search">
      {/* Search Input */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 border-border bg-white hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
        <Link
          href={searchUrl}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 inline-flex"
          aria-label={t("searchProducts")}
          onClick={(e) => {
            if (!query.trim()) {
              e.preventDefault()
            }
          }}
        >
          <Search className="h-5 w-5" />
        </Link>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("searchProducts")}
          className="flex-1 border-0 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          autoComplete="off"
          aria-label={t("searchProducts")}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-[100] overflow-y-auto max-h-96"
          role="listbox"
        >
          {suggestions.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSuggestionClick(product.slug)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b last:border-b-0 transition-colors ${
                index === selectedIndex ? "bg-blue-100" : "hover:bg-gray-50"
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {/* Product Image */}
              {product.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              )}
              {/* Product Name & Price */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {product.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(product.variants[0]?.price ?? 0) > 0
                    ? `${((product.variants[0]?.price ?? 0) / 100).toFixed(2)} ${
                        product.variants[0]?.currency ?? "EGP"
                      }`
                    : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
