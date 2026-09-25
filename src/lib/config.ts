// ============================================================================
// Store Configuration — Single source of truth for all store-wide settings.
// Edit this file to customize the store name, contact info, social links, etc.
// ============================================================================

export const siteConfig = {
  // Branding
  name: "حبيب الحبايب",
  tagline: "",
  description: "",

  // Announcement bar (confirmed)
  announcement: "أول سوبر ماركت أونلاين في الغنايم",

  // URLs
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",

  // Contact
  contact: {
    email: "",
    phone: "",
    address: {
      street: "",
      suite: "",
      city: "",
      state: "",
      zip: "",
    },
  },

  // Social links (set to "" to hide)
  social: {
    twitter: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
  },

  // Shipping & Tax (configured via backend settings)
  freeShippingThreshold: 0,
  taxRate: 0,

  // Currency & locale
  currency: "EGP",
  locale: "ar-EG",

  // Legal
  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
