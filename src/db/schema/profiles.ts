// ============================================================================
// Database Schema — Profiles & Admin Roles (Supabase Auth Identity)
// ============================================================================
// Identity & authentication credentials are managed by Supabase Auth (auth.users).
// This table stores application profile and role metadata for admins/staff.
// Customer accounts are NOT required for the MVP; customer_id on orders can link here later.
// ============================================================================

import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core"

// --- Role Enum ---
export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "admin",
  "staff",
  "customer",
])

// --- Profiles ---
export const profiles = pgTable(
  "profiles",
  {
    // Matches Supabase Auth UUID (auth.users.id)
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull().default(""),
    role: userRoleEnum("role").notNull().default("admin"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("profiles_email_idx").on(table.email),
    index("profiles_role_idx").on(table.role),
  ]
)
