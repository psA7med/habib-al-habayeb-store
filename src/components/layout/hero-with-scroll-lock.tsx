'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import HeroLogo from '@/components/layout/hero-logo'

export function HeroWithScrollLock() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const stickyHeroRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1.0)

  const MIN_SCALE = 1.0
  const MAX_SCALE = 1.15
  const ZOOM_PHASE_PERCENTAGE = 0.4 // First 40% of Hero scroll distance is zoom phase

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      // Get scroll progress within Hero container (0 to 1)
      const scrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight - window.innerHeight
      const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight))

      // Map progress to scale:
      // First 40% of scroll → 1.0 to 1.15 zoom
      // After 40% → stay at 1.15
      let newScale = MIN_SCALE
      if (progress <= ZOOM_PHASE_PERCENTAGE) {
        // Linear interpolation from 1.0 to 1.15 over first 40%
        const zoomProgress = progress / ZOOM_PHASE_PERCENTAGE
        newScale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * zoomProgress
      } else {
        // Zoom complete, stay at max scale
        newScale = MAX_SCALE
      }

      setScale(newScale)
    }

    // Use requestAnimationFrame for smooth scroll tracking
    let animationId: number
    const trackScroll = () => {
      handleScroll()
      animationId = requestAnimationFrame(trackScroll)
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      animationId = requestAnimationFrame(trackScroll)
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
      cancelAnimationFrame(animationId)
    }
  }, [MIN_SCALE, MAX_SCALE, ZOOM_PHASE_PERCENTAGE])

  // Apply CSS transform to image
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${scale})`
      imageRef.current.style.transition = 'transform 0.1s ease-out'
    }
  }, [scale])

  return (
    <div ref={scrollContainerRef} className="relative">
      {/* Hero scroll container: tall to allow pinning effect */}
      <div className="relative h-[220vh]">
        {/* Sticky Hero viewport: stays fixed while container scrolls */}
        <div
          ref={stickyHeroRef}
          className="sticky top-0 h-screen w-full overflow-hidden bg-neutral-900"
        >
          {/* Background Image with Zoom */}
          <div
            ref={imageRef}
            className="absolute inset-0 w-full h-full"
            style={{
              transformOrigin: 'center center',
            }}
          >
            <Image
              src="/hero-supermarket.jpg"
              alt="حبيب الحبايب supermarket"
              fill
              className="object-cover object-center"
              priority
              quality={90}
            />
          </div>

          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

          {/* Centered Hero Logo */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-fade-in">
              <HeroLogo />
            </div>
          </div>

          {/* Scroll Indicator */}
          {scale < MAX_SCALE - 0.01 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white text-sm opacity-60 animate-bounce">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Scroll to explore</span>
              </div>
            </div>
          )}
        </div>

        {/* Space below sticky Hero for scrolling effect */}
        <div className="h-[120vh] bg-white" />
      </div>
    </div>
  )
}
