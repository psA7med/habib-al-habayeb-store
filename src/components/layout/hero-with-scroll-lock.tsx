'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-Controlled Video Hero
 * 
 * Maps user scroll to video.currentTime:
 * - Desktop: 1920×1080 (16:9) 4-second video
 * - Mobile: 1080×1920 (9:16) 6-second video
 * 
 * Sticky viewport architecture (250vh container) allows smooth scroll control.
 * No autoplay, no looping, no additional zoom animation.
 */

export function HeroWithScrollLock() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Determine viewport size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Store video duration when metadata loads
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration)
      setIsLoaded(true)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [])

  // Track scroll and map to video currentTime
  useEffect(() => {
    if (!videoRef.current || videoDuration === 0) return

    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        // Get Hero container position and calculate scroll progress
        const heroContainer = document.querySelector('[data-hero-scroll-container]') as HTMLElement
        if (!heroContainer || !videoRef.current) {
          rafRef.current = null
          return
        }

        const heroRect = heroContainer.getBoundingClientRect()
        const containerTop = heroContainer.offsetTop
        const containerHeight = heroContainer.offsetHeight
        const windowHeight = window.innerHeight
        
        // Calculate how far through the Hero container we've scrolled
        const scrolled = Math.max(0, -heroRect.top)
        const scrollableHeight = containerHeight - windowHeight
        const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight))

        // Map progress to video currentTime
        videoRef.current.currentTime = progress * videoDuration
        rafRef.current = null
      })
    }

    // Use passive scroll listener for performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [videoDuration])

  // Select appropriate video and poster based on viewport
  const videoSrc = isMobile
    ? '/hero-video-mobile.mp4'
    : '/hero-video-desktop.mp4'
  
  const posterSrc = isMobile
    ? '/hero-video-mobile-poster.jpg'
    : '/hero-video-desktop-poster.jpg'

  return (
    <div
      data-hero-scroll-container
      className="w-full"
      style={{
        height: '300vh'
      }}
    >
      {/* Sticky Hero Viewport */}
      <div className="w-full h-screen sticky top-0 overflow-hidden bg-black">
        {/* Video Element */}
        <video
          key={isMobile ? 'mobile' : 'desktop'}
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          preload="auto"
          loop={false}
          className="w-full h-full object-cover"
          style={{
            display: 'block'
          }}
        />
      </div>
    </div>
  )
}
