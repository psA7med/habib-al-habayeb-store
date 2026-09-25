// ============================================================================
// Database Schema — Media Files
// ============================================================================

import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { profiles } from "./profiles"

// --- Media Files ---

export const mediaFiles = pgTable(
  "media_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    filename: text("filename").notNull(), // Stored filename (e.g. "prod_abc123.webp")
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(), // e.g. "image/webp"
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    url: text("url").notNull(), // Public URL from Supabase Storage
    storagePath: text("storage_path").notNull(), // Bucket path e.g. "products/abc123.webp"
    bucket: text("bucket").notNull().default("media"), // "products", "media", "hero"
    uploadedBy: text("uploaded_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("media_files_uploaded_by_idx").on(table.uploadedBy),
    index("media_files_bucket_idx").on(table.bucket),
    index("media_files_created_at_idx").on(table.createdAt),
  ]
)

// --- Relations ---

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  uploader: one(profiles, {
    fields: [mediaFiles.uploadedBy],
    references: [profiles.id],
  }),
}))
