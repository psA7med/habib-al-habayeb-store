'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import HeroLogo from '@/components/layout/hero-logo'

export function HeroWithScrollLock() {
  const heroRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1.0)
  const [isInZoomPhase, setIsInZoomPhase] = useState(true)
  const [scrollAccumulator, setScrollAccumulator] = useState(0)

  const ZOOM_SENSITIVITY = 0.015 // Scroll delta to scale conversion
  const MIN_SCALE = 1.0
  const MAX_SCALE = 1.15
  const HERO_HEIGHT = 650 // in pixels

  useEffect(() => {
    let isActive = true
    const hero = heroRef.current
    if (!hero) return

    let ticking = false

    const handleWheel = (e: WheelEvent) => {
      if (!isActive) return

      // Only handle scroll when Hero is in viewport or at zoom phase
      const heroRect = hero.getBoundingClientRect()
      const isHeroInView = heroRect.top <= window.innerHeight && heroRect.bottom >= 0

      if (!isHeroInView && !isInZoomPhase) {
        return // Allow normal scrolling if Hero is not in view and not in zoom phase
      }

      if (isInZoomPhase) {
        e.preventDefault()

        // Calculate new scale from wheel delta
        const delta = e.deltaY > 0 ? 1 : -1 // 1 for scroll down, -1 for scroll up
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta * ZOOM_SENSITIVITY))

        if (ticking) return
        ticking = true

        setScale(newScale)
        setScrollAccumulator((prev) => prev + Math.abs(e.deltaY))

        // Check if zoom phase should end (user scrolled enough to complete zoom)
        if (newScale >= MAX_SCALE - 0.01) {
          // Scroll down completed zoom
          setIsInZoomPhase(false)
          setScrollAccumulator(0)
        } else if (newScale <= MIN_SCALE + 0.01 && newScale < scale) {
          // Scroll up returned to start
          setIsInZoomPhase(false)
          setScrollAccumulator(0)
        }

        requestAnimationFrame(() => {
          ticking = false
        })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive || !isInZoomPhase) return

      if (e.touches.length !== 1) return

      // Calculate touch velocity / delta
      const touch = e.touches[0]
      const lastTouch = (e as any).lastTouch as Touch | undefined

      if (!lastTouch) {
        (e as any).lastTouch = touch
        return
      }

      const delta = touch.clientY - lastTouch.clientY
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale - delta * ZOOM_SENSITIVITY * 0.5))

      if (ticking) return
      ticking = true

      setScale(newScale)
      setScrollAccumulator((prev) => prev + Math.abs(delta))

      // Check if zoom phase should end
      if (newScale >= MAX_SCALE - 0.01) {
        setIsInZoomPhase(false)
        setScrollAccumulator(0)
      } else if (newScale <= MIN_SCALE + 0.01 && newScale < scale) {
        setIsInZoomPhase(false)
        setScrollAccumulator(0)
      }

      (e as any).lastTouch = touch

      requestAnimationFrame(() => {
        ticking = false
      })
    }

    hero.addEventListener('wheel', handleWheel, { passive: false })
    hero.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      hero.removeEventListener('wheel', handleWheel)
      hero.removeEventListener('touchmove', handleTouchMove)
      isActive = false
    }
  }, [scale, isInZoomPhase, ZOOM_SENSITIVITY])

  // Apply CSS transform to image
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${scale})`
      imageRef.current.style.transition = 'transform 0.1s ease-out'
    }
  }, [scale])

  return (
    <div
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden bg-neutral-900"
      style={{
        position: 'relative',
      }}
    >
      {/* Background Image with Zoom */}
      <div
        ref={imageRef}
        className="absolute inset-0 w-full h-full origin-center"
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

      {/* Scroll Indicator (optional, shows during zoom phase) */}
      {isInZoomPhase && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white text-sm opacity-60 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>Scroll to explore</span>
          </div>
        </div>
      )}

      {/* Categories Link Button (appears when zoom phase ends) */}
      {!isInZoomPhase && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white text-sm opacity-60 animate-fade-in">
          <div className="flex flex-col items-center gap-2">
            <span>Continue scrolling</span>
          </div>
        </div>
      )}
    </div>
  )
}
