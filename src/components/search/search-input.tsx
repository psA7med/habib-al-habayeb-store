"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"

interface SearchInputProps {
  onClose?: () => void
}

export function SearchInput({ onClose }: SearchInputProps) {
  const t = useTranslations("nav")
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      // Navigate using the link's href
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    }
  }

  const searchUrl = query.trim() ? `/search?q=${encodeURIComponent(query)}` : "#"

  return (
    <div className="w-full" role="search">
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
              inputRef.current?.focus()
            }}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
