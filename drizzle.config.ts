import { defineConfig } from "drizzle-kit"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

export default defineConfig({
  // Schema source — all table definitions
  schema: "./src/db/schema/index.ts",

  // Output directory for generated SQL migrations
  out: "./drizzle",

  // Database driver
  dialect: "postgresql",

  // Connection to Supabase PostgreSQL
  dbCredentials: {
    // Use the "Session" (direct) connection string for migrations,
    // NOT the "Transaction" pooler. Migrations need prepared statements.
    url: process.env.DATABASE_URL!,
  },

  // Verbose logging during migrations
  verbose: true,

  // Strict mode — warn on destructive changes
  strict: true,
})
