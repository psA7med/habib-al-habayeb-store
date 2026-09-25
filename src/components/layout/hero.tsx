"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface HeroProps {
  desktopImage?: string
  mobileImage?: string
  isEnabled?: boolean
}

export function Hero({
  desktopImage = "/hero-desktop.webp",
  mobileImage = "/hero-mobile.webp",
  isEnabled = true,
}: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)

  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current !== null) return

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null

        const hero = heroRef.current
        if (!hero) return

        const rect = hero.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        const scrolledPastTop = Math.max(0, -rect.top)

        const animationRange = Math.max(
          1,
          Math.min(rect.height, viewportHeight)
        )

        const progress = Math.min(
          1,
          scrolledPastTop / animationRange
        )

        // Subtle zoom: 1.00 → 1.06
        const nextScale = 1 + progress * 0.06

        // Subtle fade: 1.00 → 0.92
        const nextOpacity = 1 - progress * 0.08

        setScale(nextScale)
        setOpacity(nextOpacity)
      })
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [])

  if (!isEnabled) {
    return null
  }

  const dImage = desktopImage || "/hero-desktop.webp"
  const mImage = mobileImage || "/hero-mobile.webp"

  return (
    <section
      ref={heroRef}
      aria-label="حبيب الحبايب"
      className="
        relative
        w-full
        min-h-[calc(100svh-56px)]
        md:min-h-[calc(100vh-64px)]
        overflow-hidden
        bg-white
      "
    >
      <div className="relative h-full min-h-[inherit] w-full">
        <picture className="block h-full w-full">
          {/* Mobile */}
          <source
            media="(max-width: 767px)"
            srcSet={mImage}
            type="image/webp"
          />

          {/* Desktop */}
          <source
            media="(min-width: 768px)"
            srcSet={dImage}
            type="image/webp"
          />

          <Image
            src={dImage}
            alt="حبيب الحبايب — متجر البقالة"
            fill
            priority
            sizes="100vw"
            className="
              object-cover
              transform-gpu
              will-change-transform
              transition-[transform,opacity]
              duration-300
              ease-out

              /* Mobile: keep normal center framing */
              object-center

              /* Desktop: prioritize the storefront sign */
              md:object-[center_18%]
            "
            style={{
              transform: `scale(${scale})`,
              opacity,
              transformOrigin: "center 18%",
            }}
          />
        </picture>
      </div>

      {/* White fade into Categories */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          z-10
          h-[30%]
        "
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0.18) 62%, rgba(255,255,255,0.42) 75%, rgba(255,255,255,0.72) 88%, rgba(255,255,255,0.95) 96%, #ffffff 100%)",
        }}
      />
    </section>
  )
}