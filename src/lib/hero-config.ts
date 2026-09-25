// ============================================================================
// Hero Configuration — Centralized Hero image & content sources
// ============================================================================
// This file is the single source of truth for Hero media.
// It will later be replaced by Admin-managed values from a backend/storage phase.
// For now, the provided images are registered as the default Hero image URLs.
// ============================================================================

export interface HeroConfig {
  /** Desktop hero image — 16:9 aspect ratio */
  desktopImage: string
  /** Mobile hero image — 9:16 aspect ratio */
  mobileImage: string
}

export const heroConfig: HeroConfig = {
  desktopImage: "/hero-desktop.webp",
  mobileImage: "/hero-mobile.webp",
}
