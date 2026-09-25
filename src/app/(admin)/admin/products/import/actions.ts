"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import {
  products,
  productVariants,
  productImages,
  productCategories,
  categories,
} from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { requireAdmin } from "@/lib/supabase/auth"

export interface ParsedCsvRow {
  index: number
  rawData: Record<string, string>
  mappedData?: {
    nameAr: string
    sku?: string
    barcode?: string
    priceEgp: number
    compareAtPriceEgp?: number
    categoryName?: string
    quantity: number
    descriptionAr?: string
    imageUrl?: string
  }
  validationError?: string
  isDuplicate?: boolean
  duplicateReason?: string
}

export interface CsvAnalysisResult {
  headers: string[]
  totalRows: number
  validRowsCount: number
  invalidRowsCount: number
  duplicateCount: number
  detectedCategories: string[]
  unknownCategories: string[]
  existingCategories: { id: string; nameAr: string; slug: string }[]
  previewRows: ParsedCsvRow[]
}

import { decodeCsvBuffer, parseCsvLines } from "@/lib/csv-utils"
import { assertRateLimit, RateLimits } from "@/lib/rate-limit"

/**
 * Analyzes uploaded CSV content and prepares mapping preview and validation.
 */
export async function analyzeCsvContent(csvInput: string): Promise<CsvAnalysisResult> {
  await requireAdmin()

  await assertRateLimit(
    RateLimits.CSV_IMPORT.action,
    RateLimits.CSV_IMPORT.limit,
    RateLimits.CSV_IMPORT.windowSeconds,
    undefined,
    RateLimits.CSV_IMPORT.errorMessage
  )

  let csvText = csvInput
  if (csvInput.startsWith("base64,")) {
    const buf = Buffer.from(csvInput.slice(7), "base64")
    csvText = decodeCsvBuffer(buf)
  }

  const rawRows = parseCsvLines(csvText)
  if (rawRows.length < 2) {
    throw new Error("ملف CSV فارغ أو لا يحتوي على صفوف بيانات.")
  }

  const headers = rawRows[0].map((h) => h.trim())
  const dataRows = rawRows.slice(1)

  // Fetch existing categories, SKUs, and barcodes from DB for duplicate/mapping detection
  const [existingCats, existingVariants, existingProducts] = await Promise.all([
    db.select({ id: categories.id, nameAr: categories.nameAr, slug: categories.slug }).from(categories),
    db.select({ sku: productVariants.sku, barcode: productVariants.barcode }).from(productVariants),
    db.select({ nameAr: products.nameAr, slug: products.slug }).from(products),
  ])

  const existingSkus = new Set(existingVariants.map((v) => v.sku.toLowerCase()).filter(Boolean))
  const existingBarcodes = new Set(existingVariants.map((v) => (v.barcode || "").toLowerCase()).filter(Boolean))
  const existingNames = new Set(existingProducts.map((p) => p.nameAr.toLowerCase()))

  // Auto-detect column indices
  const findHeaderIdx = (patterns: string[]) =>
    headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return patterns.some((p) => lower.includes(p.toLowerCase()))
    })

  const nameIdx = findHeaderIdx(["اسم", "المنتج", "name", "title", "product"])
  const skuIdx = findHeaderIdx(["sku", "كود", "رمز", "code"])
  const barcodeIdx = findHeaderIdx(["barcode", "باركود", "upc", "ean"])
  const priceIdx = findHeaderIdx(["سعر", "السعر", "price"])
  const comparePriceIdx = findHeaderIdx(["سعر قبل", "original price", "compare", "old price"])
  const categoryIdx = findHeaderIdx(["قسم", "القسم", "فئة", "تصنيف", "category"])
  const qtyIdx = findHeaderIdx(["كمية", "الكمية", "stock", "qty", "quantity"])
  const descIdx = findHeaderIdx(["وصف", "الوصف", "desc", "description"])
  const imgIdx = findHeaderIdx(["صورة", "رابط الصورة", "image", "img", "photo"])

  const detectedCategorySet = new Set<string>()
  const parsedRows: ParsedCsvRow[] = []

  let validCount = 0
  let invalidCount = 0
  let duplicateCount = 0

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowRecord: Record<string, string> = {}
    headers.forEach((h, hIdx) => {
      rowRecord[h] = row[hIdx] || ""
    })

    const nameAr = nameIdx !== -1 ? row[nameIdx] || "" : row[0] || ""
    const sku = skuIdx !== -1 ? row[skuIdx] || "" : ""
    const barcode = barcodeIdx !== -1 ? row[barcodeIdx] || "" : ""
    const priceStr = priceIdx !== -1 ? row[priceIdx] || "0" : "0"
    const comparePriceStr = comparePriceIdx !== -1 ? row[comparePriceIdx] || "" : ""
    const categoryName = categoryIdx !== -1 ? row[categoryIdx] || "" : ""
    const qtyStr = qtyIdx !== -1 ? row[qtyIdx] || "0" : "0"
    const descriptionAr = descIdx !== -1 ? row[descIdx] || "" : ""
    const imageUrl = imgIdx !== -1 ? row[imgIdx] || "" : ""

    if (categoryName) detectedCategorySet.add(categoryName.trim())

    const parsedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""))
    const parsedComparePrice = comparePriceStr
      ? parseFloat(comparePriceStr.replace(/[^0-9.]/g, ""))
      : undefined
    const parsedQty = parseInt(qtyStr.replace(/[^0-9]/g, ""), 10) || 0

    let validationError: string | undefined
    if (!nameAr || nameAr.trim().length < 2) {
      validationError = "اسم المنتج غير صالح أو مفقود"
    } else if (isNaN(parsedPrice) || parsedPrice <= 0) {
      validationError = "السعر غير صالح (يجب أن يكون رقم موجب)"
    }

    let isDuplicate = false
    let duplicateReason: string | undefined

    if (sku && existingSkus.has(sku.toLowerCase())) {
      isDuplicate = true
      duplicateReason = `الكود (SKU: ${sku}) موجود مسبقاً`
    } else if (barcode && existingBarcodes.has(barcode.toLowerCase())) {
      isDuplicate = true
      duplicateReason = `الباركود (${barcode}) موجود مسبقاً`
    } else if (existingNames.has(nameAr.trim().toLowerCase())) {
      isDuplicate = true
      duplicateReason = `اسم المنتج (${nameAr}) موجود مسبقاً`
    }

    if (validationError) {
      invalidCount++
    } else if (isDuplicate) {
      duplicateCount++
    } else {
      validCount++
    }

    parsedRows.push({
      index: i + 1,
      rawData: rowRecord,
      mappedData: {
        nameAr: nameAr.trim(),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        priceEgp: isNaN(parsedPrice) ? 0 : parsedPrice,
        compareAtPriceEgp: isNaN(parsedComparePrice!) ? undefined : parsedComparePrice,
        categoryName: categoryName.trim() || undefined,
        quantity: parsedQty,
        descriptionAr: descriptionAr.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      },
      validationError,
      isDuplicate,
      duplicateReason,
    })
  }

  const existingCatNames = new Set(existingCats.map((c) => c.nameAr.toLowerCase()))
  const unknownCats = Array.from(detectedCategorySet).filter(
    (c) => !existingCatNames.has(c.toLowerCase())
  )

  return {
    headers,
    totalRows: dataRows.length,
    validRowsCount: validCount,
    invalidRowsCount: invalidCount,
    duplicateCount,
    detectedCategories: Array.from(detectedCategorySet),
    unknownCategories: unknownCats,
    existingCategories: existingCats,
    previewRows: parsedRows.slice(0, 100), // Preview up to first 100 rows
  }
}

export interface CsvImportSubmission {
  rows: Array<{
    nameAr: string
    sku?: string
    barcode?: string
    priceEgp: number
    compareAtPriceEgp?: number
    categoryName?: string
    quantity: number
    descriptionAr?: string
    imageUrl?: string
  }>
  categoryMappings: Record<string, { action: "map" | "create" | "ignore"; targetCategoryId?: string }>
}

export interface ImportReport {
  importedCount: number
  categoriesCreatedCount: number
  failedCount: number
  errors: string[]
}

/**
 * Executes transactional batch import of validated rows defaulting to status: 'draft'.
 */
export async function executeCsvImportAction(
  submission: CsvImportSubmission
): Promise<ImportReport> {
  await requireAdmin()

  await assertRateLimit(
    RateLimits.CSV_IMPORT.action,
    RateLimits.CSV_IMPORT.limit,
    RateLimits.CSV_IMPORT.windowSeconds,
    undefined,
    RateLimits.CSV_IMPORT.errorMessage
  )

  if (!submission.rows || submission.rows.length === 0) {
    throw new Error("لا توجد صفوف صالحة للاستيراد.")
  }

  const report: ImportReport = {
    importedCount: 0,
    categoriesCreatedCount: 0,
    failedCount: 0,
    errors: [],
  }

  // 1. Process category creations / mappings
  const categoryIdMap = new Map<string, string | null>() // categoryName -> categoryId

  // Fetch existing categories to resolve target category IDs
  const existingCats = await db.select().from(categories)
  existingCats.forEach((c) => {
    categoryIdMap.set(c.nameAr.toLowerCase(), c.id)
  })

  for (const [catName, config] of Object.entries(submission.categoryMappings)) {
    if (config.action === "map" && config.targetCategoryId) {
      categoryIdMap.set(catName.toLowerCase(), config.targetCategoryId)
    } else if (config.action === "create") {
      const slug =
        "cat-" +
        catName
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 40) +
        "-" +
        crypto.randomUUID().slice(0, 4)

      const newCatId = crypto.randomUUID()
      try {
        await db.insert(categories).values({
          id: newCatId,
          nameAr: catName,
          nameEn: "",
          slug,
          descriptionAr: "",
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        categoryIdMap.set(catName.toLowerCase(), newCatId)
        report.categoriesCreatedCount++
      } catch (err: any) {
        report.errors.push(`فشل إنشاء القسم (${catName}): ${err.message}`)
      }
    } else {
      categoryIdMap.set(catName.toLowerCase(), null)
    }
  }

  // 2. Batch insert imported products in draft status
  for (const row of submission.rows) {
    try {
      if (!row.nameAr || row.priceEgp <= 0) {
        report.failedCount++
        continue
      }

      const productId = crypto.randomUUID()
      const slugBase =
        row.nameAr
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 50) || "product"
      const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`

      const pricePiasters = Math.round(row.priceEgp * 100)
      const comparePricePiasters = row.compareAtPriceEgp
        ? Math.round(row.compareAtPriceEgp * 100)
        : null

      // Insert product as 'draft'
      await db.insert(products).values({
        id: productId,
        nameAr: row.nameAr,
        nameEn: "",
        slug,
        descriptionAr: row.descriptionAr || "",
        status: "draft", // Default to draft per specifications
        isFeatured: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Insert primary variant
      await db.insert(productVariants).values({
        id: crypto.randomUUID(),
        productId,
        nameAr: row.nameAr,
        sku: row.sku || "",
        barcode: row.barcode || null,
        price: pricePiasters,
        compareAtPrice: comparePricePiasters,
        currency: "EGP",
        quantity: Math.max(0, row.quantity || 0),
        trackInventory: true,
        isActive: true,
      })

      // Insert category join if resolved
      if (row.categoryName) {
        const targetCatId = categoryIdMap.get(row.categoryName.toLowerCase())
        if (targetCatId) {
          await db.insert(productCategories).values({
            productId,
            categoryId: targetCatId,
            isPrimary: true,
          })
        }
      }

      // Insert image if provided
      if (row.imageUrl && (row.imageUrl.startsWith("http://") || row.imageUrl.startsWith("https://") || row.imageUrl.startsWith("/"))) {
        await db.insert(productImages).values({
          id: crypto.randomUUID(),
          productId,
          url: row.imageUrl,
          altAr: row.nameAr,
          sortOrder: 0,
          isCover: true,
        })
      }

      report.importedCount++
    } catch (err: any) {
      report.failedCount++
      report.errors.push(`فشل استيراد (${row.nameAr}): ${err.message}`)
    }
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin/categories")
  return report
}
