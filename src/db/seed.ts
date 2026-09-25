// ============================================================================
// Database Seed Script — Habib Al-Habayeb (حبيب الحبايب)
// ============================================================================
// Initializes site settings, hero settings, and default admin schema.
// Real catalog items are imported via the Admin CSV Import pipeline (/admin/products/import).
// Run with: npx tsx src/db/seed.ts
// ============================================================================

import { db } from "./index"
import * as schema from "./schema"

async function runSeed() {
  console.log("🌱 Initializing Habib Al-Habayeb database settings...")

  // 1. Seed Site Settings (Singleton)
  console.log("⚙️  Seeding confirmed site settings...")
  await db
    .insert(schema.siteSettings)
    .values({
      id: "default",
      storeName: "حبيب الحبايب",
      tagline: "",
      description: "",
      announcementText: "أول سوبر ماركت أونلاين في الغنايم",
      hotline: "",
      whatsapp: "",
      contactEmail: "",
      standardDeliveryFee: 0,
      freeDeliveryThreshold: null,
      taxRate: 0,
      currency: "EGP",
      locale: "ar-EG",
      maintenanceMode: false,
    })
    .onConflictDoNothing()

  // 2. Seed Hero Settings (Singleton)
  console.log("🖼️  Seeding confirmed hero settings...")
  await db
    .insert(schema.heroSettings)
    .values({
      id: "default",
      desktopImageUrl: "/hero-desktop.webp",
      mobileImageUrl: "/hero-mobile.webp",
      announcementText: "أول سوبر ماركت أونلاين في الغنايم",
      overlayTextAr: null,
      isEnabled: true,
      ctaUrl: null,
      ctaTextAr: null,
    })
    .onConflictDoNothing()

  console.log("✅ Seed completed. Ready for real catalog CSV import.")
}

runSeed().catch((error) => {
  console.error("❌ Seed failed:", error)
  process.exit(1)
})
