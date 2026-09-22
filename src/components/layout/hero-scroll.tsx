'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export function HeroScroll() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !imageRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const heroBottom = rect.bottom
      const viewportHeight = window.innerHeight

      // Calculate scroll progress (0 to 1) as user scrolls through hero
      // When hero is fully visible at top: progress = 0
      // When hero is scrolled out of view: progress = 1
      let scrollProgress = Math.max(0, Math.min(1, (viewportHeight - heroBottom) / viewportHeight))

      // Scale from 1.0 to 1.15
      const minScale = 1.0
      const maxScale = 1.15
      const newScale = minScale + (maxScale - minScale) * scrollProgress

      setScale(newScale)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* Background image with scroll zoom */}
      <div
        ref={imageRef}
        className="absolute inset-0 transition-transform duration-75"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <Image
          src="/hero-supermarket.jpg"
          alt="حبيب الحبايب - محل بقالة"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>

      {/* Logo overlay - centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative z-10 flex h-auto w-64 items-center justify-center md:w-80">
          <Image
            src="/logo.svg"
            alt="حبيب الحبايب"
            width={400}
            height={133}
            className="h-auto w-full object-contain drop-shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Subtle gradient overlay to ensure readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
    </section>
  )
}
