import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

// Handle Next.js server-only import in standalone test scripts
try {
  const serverOnlyPath = require.resolve("server-only")
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as any
} catch {}

import fs from "fs"
import path from "path"
import sharp from "sharp"
import iconv from "iconv-lite"
import postgres from "postgres"

let passedCount = 0
let failedCount = 0

function testAssert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`)
    passedCount++
  } else {
    console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ""}`)
    failedCount++
  }
}

async function runSecurityVerifications() {
  const { processAndOptimizeImage } = await import("../src/lib/storage")
  const { checkRateLimit, assertRateLimit } = await import("../src/lib/rate-limit")
  const { decodeCsvBuffer } = await import("../src/lib/csv-utils")
  const { dbProductRepository } = await import("../src/lib/repositories/db-product-repository")
  const { dbCategoryRepository } = await import("../src/lib/repositories/db-category-repository")
  const { dbBrandRepository } = await import("../src/lib/repositories/db-brand-repository")
  console.log("\n========================================================")
  console.log("🛡️  HABIB AL-HABAYEB — BACKEND HARDENING VERIFICATION")
  console.log("========================================================\n")

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: Image Optimization Pipeline (Sharp + WebP + Resizing)
  // ---------------------------------------------------------------------------
  console.log("📸 1. Testing Image Optimization Pipeline...")
  try {
    // Generate a 2400x1800 uncompressed test PNG image in memory
    const testImageBuffer = await sharp({
      create: {
        width: 2400,
        height: 1800,
        channels: 3,
        background: { r: 34, g: 197, b: 94 }, // Emerald green
      },
    })
      .png()
      .toBuffer()

    const rawSize = testImageBuffer.length

    // Process through our optimization pipeline for product image (max 1200px)
    const result = await processAndOptimizeImage(testImageBuffer, "image/png", {
      folder: "products",
      quality: 80,
    })

    testAssert("Converts image to WebP format", result.mimeType === "image/webp")
    testAssert("Calculates output size in bytes", result.sizeBytes > 0 && result.sizeBytes < rawSize)
    testAssert(
      "Enforces max dimension constraint (max 1200px for products)",
      result.width !== undefined && result.width <= 1200 && result.height !== undefined && result.height <= 1200,
      `width=${result.width}, height=${result.height}`
    )
    testAssert("Returns valid extension .webp", result.extension === "webp")
  } catch (err: any) {
    testAssert("Image optimization pipeline execution", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: Server-Side Rate Limiting
  // ---------------------------------------------------------------------------
  console.log("\n⏱️  2. Testing Server-Side Rate Limiting...")
  try {
    const testAction = `test_action_${Date.now()}`
    const testIp = "192.168.1.100"
    const limit = 3
    const windowSecs = 60

    const r1 = checkRateLimit(`${testAction}:${testIp}`, limit, windowSecs)
    const r2 = checkRateLimit(`${testAction}:${testIp}`, limit, windowSecs)
    const r3 = checkRateLimit(`${testAction}:${testIp}`, limit, windowSecs)
    const r4 = checkRateLimit(`${testAction}:${testIp}`, limit, windowSecs)

    testAssert("Allows requests within rate limit (1..3)", r1.success && r2.success && r3.success)
    testAssert("Rejects 4th request exceeding limit=3", !r4.success && r4.remaining === 0)
    testAssert("Provides cooldown reset seconds", r4.resetInSeconds > 0 && r4.resetInSeconds <= 60)

    // Test assertRateLimit exception
    let caught = false
    try {
      await assertRateLimit(testAction, limit, windowSecs, testIp)
    } catch (err: any) {
      caught = true
      testAssert("assertRateLimit error message contains Arabic cooldown warning", err.message.includes("الحد المسموح"))
    }
    testAssert("assertRateLimit throws user-friendly exception when blocked", caught)
  } catch (err: any) {
    testAssert("Rate limiting test execution", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: Windows-1256 Arabic CSV Decoding
  // ---------------------------------------------------------------------------
  console.log("\n📄 3. Testing Windows-1256 Arabic CSV Robustness...")
  try {
    const arabicText = "اسم المنتج,السعر,الكمية\nسكر الأسرة 1 كجم,35.5,50\nأرز الضحى 5 كجم,175,20"
    const win1256Buffer = iconv.encode(arabicText, "win1256")
    const decoded = decodeCsvBuffer(win1256Buffer)

    testAssert("Correctly decodes Windows-1256 encoded Arabic text", decoded.includes("سكر الأسرة") && decoded.includes("أرز الضحى"))
    testAssert("Decoded text contains correct column headers", decoded.includes("اسم المنتج") && decoded.includes("السعر"))
  } catch (err: any) {
    testAssert("CSV decoding test execution", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: Production JSON Fallback Elimination
  // ---------------------------------------------------------------------------
  console.log("\n🛑 4. Testing Production JSON Fallback Elimination...")
  try {
    // Ensure environment forbids fallback
    process.env.ALLOW_JSON_FALLBACK = "false"
    ;(process.env as any).NODE_ENV = "production"

    // Query non-existent product slug
    const nonExistent = await dbProductRepository.getBySlug("definitely-non-existent-product-123456789")
    testAssert("getBySlug for missing slug returns null (not demo electronic data)", nonExistent === null)

    const nonExistentCategory = await dbCategoryRepository.getBySlug("definitely-non-existent-category-123456789")
    testAssert("getBySlug for missing category returns null (not demo electronic category)", nonExistentCategory === null)

    const nonExistentBrand = await dbBrandRepository.getBySlug("definitely-non-existent-brand-123456789")
    testAssert("getBySlug for missing brand returns null (not demo electronics brand)", nonExistentBrand === null)
  } catch (err: any) {
    testAssert("Production fallback behavior test execution", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: Database RLS Verification (Direct Postgres Policy Inspection)
  // ---------------------------------------------------------------------------
  console.log("\n🔒 5. Testing PostgreSQL Row Level Security (RLS) State...")
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    const sql = postgres(dbUrl, { prepare: false, ssl: "require", max: 1 })
    try {
      const rlsTables = await sql`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public';
      `

      const expectedTables = [
        "profiles",
        "brands",
        "categories",
        "products",
        "product_categories",
        "product_variants",
        "product_images",
        "orders",
        "order_line_items",
        "order_status_history",
        "payment_records",
        "media_files",
        "site_settings",
        "hero_settings",
      ]

      for (const t of expectedTables) {
        const found = rlsTables.find((r: any) => r.tablename === t)
        testAssert(`Table '${t}' has RLS ENABLED`, found?.rowsecurity === true)
      }

      // Check helper functions
      const funcs = await sql`
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN ('is_admin', 'is_staff_or_admin');
      `
      const funcNames = funcs.map((f: any) => f.proname)
      testAssert("Function public.is_admin() exists", funcNames.includes("is_admin"))
      testAssert("Function public.is_staff_or_admin() exists", funcNames.includes("is_staff_or_admin"))

      // Check RLS policies count
      const policies = await sql`
        SELECT tablename, policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public';
      `
      testAssert("Comprehensive RLS policies installed across all tables", policies.length >= 14, `Found ${policies.length} policies`)
    } catch (dbErr: any) {
      testAssert("RLS inspection query", false, dbErr.message)
    } finally {
      await sql.end()
    }
  }

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n========================================================")
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log("========================================================\n")

  if (failedCount > 0) {
    process.exit(1)
  }
}

runSecurityVerifications().catch((err) => {
  console.error("Verification error:", err)
  process.exit(1)
})
