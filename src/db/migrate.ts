import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

import postgres from "postgres"
import fs from "fs"
import path from "path"

async function runMigration() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL is not set.")
    process.exit(1)
  }

  console.log("Connecting to Supabase PostgreSQL...")
  const sql = postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 1,
  })

  try {
    const drizzleDir = path.join(process.cwd(), "drizzle")
    const migrationFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()

    console.log(`Found ${migrationFiles.length} migration file(s): ${migrationFiles.join(", ")}`)

    for (const file of migrationFiles) {
      const migrationFilePath = path.join(drizzleDir, file)
      const migrationSql = fs.readFileSync(migrationFilePath, "utf8")
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      console.log(`Executing ${statements.length} migration statements from ${file}...`)

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        try {
          await sql.unsafe(stmt)
        } catch (err: any) {
          if (
            err.message?.includes("already exists") ||
            err.message?.includes("duplicate key") ||
            err.message?.includes("already enabled")
          ) {
            console.log(`Notice: statement ${i + 1} in ${file} skipped (${err.message})`)
          } else {
            console.warn(`Warning on statement ${i + 1} in ${file}: ${err.message}`)
            throw err
          }
        }
      }
    }

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log("✅ Successfully applied migrations! Existing public tables:")
    console.log(tables.map((t: any) => t.table_name).sort())

    await sql`
      INSERT INTO site_settings (id, store_name, announcement_text)
      VALUES ('default', 'حبيب الحبايب', 'أول سوبر ماركت أونلاين في الغنايم')
      ON CONFLICT (id) DO NOTHING;
    `
    await sql`
      INSERT INTO hero_settings (id, announcement_text, desktop_image_url, mobile_image_url, is_enabled)
      VALUES ('default', 'أول سوبر ماركت أونلاين في الغنايم', '/hero-desktop.webp', '/hero-mobile.webp', true)
      ON CONFLICT (id) DO NOTHING;
    `

    console.log("✅ Singleton rows (site_settings, hero_settings) verified.")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigration()
