// ============================================================================
// Database Schema — Site Settings & Hero Settings
// ============================================================================

import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { profiles } from "./profiles"

// --- Hero Settings ---

export const heroSettings = pgTable("hero_settings", {
  id: text("id").primaryKey().default("default"), // singleton row
  desktopImageUrl: text("desktop_image_url")
    .notNull()
    .default("/hero-desktop.webp"),
  mobileImageUrl: text("mobile_image_url")
    .notNull()
    .default("/hero-mobile.webp"),
  announcementText: text("announcement_text")
    .notNull()
    .default("أول سوبر ماركت أونلاين في الغنايم"),
  overlayTextAr: text("overlay_text_ar"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  ctaUrl: text("cta_url"),
  ctaTextAr: text("cta_text_ar"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text("updated_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
})

// --- Site Settings (singleton) ---

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("default"), // singleton row
  storeName: text("store_name").notNull().default("حبيب الحبايب"),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  announcementText: text("announcement_text")
    .notNull()
    .default("أول سوبر ماركت أونلاين في الغنايم"),
  hotline: text("hotline").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  standardDeliveryFee: integer("standard_delivery_fee")
    .notNull()
    .default(0), // in piasters, 0 unless configured
  freeDeliveryThreshold: integer("free_delivery_threshold"), // nullable unless configured
  taxRate: real("tax_rate").notNull().default(0), // 0 unless configured
  currency: text("currency").notNull().default("EGP"),
  locale: text("locale").notNull().default("ar-EG"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  contactInfo: jsonb("contact_info").notNull().default({
    email: "",
    phone: "",
    address: { street: "", city: "", governorate: "", postalCode: "" },
  }),
  socialLinks: jsonb("social_links").notNull().default({
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// --- Relations ---

export const heroSettingsRelations = relations(heroSettings, ({ one }) => ({
  updatedByUser: one(profiles, {
    fields: [heroSettings.updatedBy],
    references: [profiles.id],
  }),
}))
