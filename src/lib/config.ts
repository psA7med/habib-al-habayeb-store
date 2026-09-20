// ============================================================================
// Store Configuration — Single source of truth for all store-wide settings.
// Edit this file to customize the store name, contact info, social links, etc.
// ============================================================================

export const siteConfig = {
  // Branding
  name: "حبيب الحبايب",
  tagline: "كل احتياجات البيت في مكان واحد",
  description:
    "متجر البقالة الالكترونية الأول في مصر. نوفر لك كل احتياجات البيت من منتجات طازة وموثوقة بأسعار مناسبة.",

  // Announcement bar (set to "" to hide)
  announcement: "",

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

  // Shipping
  freeShippingThreshold: 50000, // in cents (500 EGP)
  taxRate: 0.14, // 14% Egyptian VAT

  // Currency & locale
  currency: "EGP",
  locale: "ar-EG",

  // Legal
  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
