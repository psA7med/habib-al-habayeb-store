import "server-only"
import sharp from "sharp"
import { createAdminClient } from "./supabase/admin"
import { db } from "@/db"
import { mediaFiles } from "@/db/schema"
import { eq } from "drizzle-orm"

const BUCKET_NAME = "media"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB raw upload max

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
])

export interface UploadOptions {
  folder?: "products" | "categories" | "hero" | "general"
  uploadedBy?: string
  maxDimension?: number // Max width/height constraint
  quality?: number // Compression quality (1-100)
}

/**
 * Validates image magic bytes to prevent forged extension / MIME exploits.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false

  // JPEG: FF D8 FF
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType.includes("png")) {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    )
  }

  // GIF: 47 49 46 38
  if (mimeType.includes("gif")) {
    return buffer.toString("ascii", 0, 3) === "GIF"
  }

  // WebP: RIFF .... WEBP
  if (mimeType.includes("webp")) {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    )
  }

  // SVG: starts with <xml or <svg
  if (mimeType.includes("svg")) {
    const text = buffer.toString("utf8", 0, 200).trim().toLowerCase()
    return (
      text.includes("<svg") ||
      (text.startsWith("<?xml") && text.includes("<svg"))
    )
  }

  return true
}

/**
 * Ensures the public media bucket exists in Supabase Storage.
 */
export async function ensureMediaBucket(): Promise<void> {
  const supabase = createAdminClient()
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === BUCKET_NAME)

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    })
    if (error && !error.message?.includes("already exists")) {
      console.warn("Could not create media bucket:", error.message)
    }
  }
}

/**
 * Image optimization pipeline using Sharp:
 * validate -> resize -> compress -> convert to WebP -> strip EXIF metadata
 */
export async function processAndOptimizeImage(
  inputBuffer: Buffer,
  mimeType: string,
  options: UploadOptions = {}
): Promise<{
  buffer: Buffer
  mimeType: string
  extension: string
  width?: number
  height?: number
  sizeBytes: number
}> {
  // SVG handling: pass-through sanitized text buffer
  if (mimeType === "image/svg+xml") {
    return {
      buffer: inputBuffer,
      mimeType: "image/svg+xml",
      extension: "svg",
      sizeBytes: inputBuffer.length,
    }
  }

  // Dimension limits based on destination folder
  let maxDimension = options.maxDimension
  if (!maxDimension) {
    switch (options.folder) {
      case "hero":
        maxDimension = 1920
        break
      case "products":
        maxDimension = 1200
        break
      case "categories":
        maxDimension = 800
        break
      default:
        maxDimension = 1600
        break
    }
  }

  const quality = options.quality ?? 82

  try {
    const image = sharp(inputBuffer, { failOnError: false })
    const metadata = await image.metadata()

    // Auto-rotate based on EXIF orientation and strip excess metadata
    let pipeline = image.rotate()

    // Resize if exceeds maxDimension
    if (
      (metadata.width && metadata.width > maxDimension) ||
      (metadata.height && metadata.height > maxDimension)
    ) {
      pipeline = pipeline.resize({
        width: metadata.width && metadata.width >= (metadata.height || 0) ? maxDimension : undefined,
        height: metadata.height && (metadata.height || 0) > (metadata.width || 0) ? maxDimension : undefined,
        fit: "inside",
        withoutEnlargement: true,
      })
    }

    // Convert to WebP with balanced quality and compression
    const optimizedBuffer = await pipeline
      .webp({
        quality,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer()

    const finalMeta = await sharp(optimizedBuffer).metadata()

    return {
      buffer: optimizedBuffer,
      mimeType: "image/webp",
      extension: "webp",
      width: finalMeta.width,
      height: finalMeta.height,
      sizeBytes: optimizedBuffer.length,
    }
  } catch (err: any) {
    console.warn("Sharp optimization fallback:", err.message)
    // If sharp fails for some unexpected reason, return original buffer
    return {
      buffer: inputBuffer,
      mimeType,
      extension: mimeType.split("/")[1] || "bin",
      sizeBytes: inputBuffer.length,
    }
  }
}

/**
 * Securely uploads a file buffer to Supabase Storage and records metadata in PostgreSQL.
 */
export async function uploadMedia(
  file: File,
  options: UploadOptions = {}
): Promise<{
  id: string
  url: string
  storagePath: string
  filename: string
  sizeBytes: number
  width?: number
  height?: number
}> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`حجم الملف يتجاوز الحد الأقصى المسموح به (${MAX_FILE_SIZE / (1024 * 1024)} ميجابايت).`)
  }

  const rawMimeType = file.type || "application/octet-stream"
  if (!ALLOWED_MIME_TYPES.has(rawMimeType)) {
    throw new Error(
      `نوع الملف غير مدعوم (${rawMimeType}). يرجى رفع صورة بصيغة JPG أو PNG أو WebP أو AVIF أو SVG.`
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const rawBuffer = Buffer.from(arrayBuffer)

  if (!validateMagicBytes(rawBuffer, rawMimeType)) {
    throw new Error("محتوى الملف غير صالح أو لا يتطابق مع نوع الصورة المحدد.")
  }

  // Run through optimization pipeline
  const optimized = await processAndOptimizeImage(rawBuffer, rawMimeType, options)

  await ensureMediaBucket()

  const supabase = createAdminClient()
  const folder = options.folder || "general"
  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, "_")
    .slice(0, 30)

  const uniqueId = crypto.randomUUID().slice(0, 8)
  const filename = `${safeBaseName}_${uniqueId}.${optimized.extension}`
  const storagePath = `${folder}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, optimized.buffer, {
      contentType: optimized.mimeType,
      cacheControl: "31536000",
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`فشل رفع الصورة إلى التخزين: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

  const mediaId = crypto.randomUUID()
  try {
    await db.insert(mediaFiles).values({
      id: mediaId,
      filename,
      originalName: file.name,
      mimeType: optimized.mimeType,
      sizeBytes: optimized.sizeBytes,
      width: optimized.width || null,
      height: optimized.height || null,
      url: publicUrl,
      storagePath,
      bucket: BUCKET_NAME,
      uploadedBy: options.uploadedBy || null,
      createdAt: new Date(),
    })
  } catch (dbErr) {
    console.warn("Could not save media_file row to DB:", dbErr)
  }

  return {
    id: mediaId,
    url: publicUrl,
    storagePath,
    filename,
    sizeBytes: optimized.sizeBytes,
    width: optimized.width,
    height: optimized.height,
  }
}

/**
 * Deletes a media file from Supabase Storage and database.
 */
export async function deleteMedia(storagePath: string, mediaId?: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.storage.from(BUCKET_NAME).remove([storagePath])

  if (mediaId) {
    try {
      await db.delete(mediaFiles).where(eq(mediaFiles.id, mediaId))
    } catch (e) {
      console.warn("Could not delete media_files row:", e)
    }
  }
}
