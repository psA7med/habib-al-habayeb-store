"use client"

import { useState } from "react"
import { UploadCloud, Trash2, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadMediaAction, deleteMediaAction } from "./actions"

interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
  storagePath: string
  createdAt: Date
}

export function MediaGallery({ initialFiles }: { initialFiles: MediaItem[] }) {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await uploadMediaAction(formData)
      if (res.file) {
        setFiles([
          {
            id: res.file.id,
            filename: res.file.filename,
            originalName: file.name,
            mimeType: file.type,
            sizeBytes: res.file.sizeBytes,
            url: res.file.url,
            storagePath: res.file.storagePath,
            createdAt: new Date(),
          },
          ...files,
        ])
      }
    } catch (err: any) {
      setError(err?.message || "فشل رفع الصورة")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (file: MediaItem) => {
    if (!confirm(`هل أنت متأكد من حذف الصورة (${file.originalName})؟`)) return
    try {
      await deleteMediaAction(file.id, file.storagePath)
      setFiles(files.filter((f) => f.id !== file.id))
    } catch (err: any) {
      alert(err?.message || "فشل حذف الصورة")
    }
  }

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Upload Box */}
      <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-8 text-center">
        <label className="inline-flex cursor-pointer flex-col items-center justify-center">
          <UploadCloud className="h-10 w-10 text-neutral-400 mb-2" />
          <span className="text-sm font-semibold text-neutral-900">
            {uploading ? "جاري رفع الصورة والضغط..." : "اضغط لرفع صورة جديدة إلى التخزين"}
          </span>
          <span className="text-xs text-neutral-500 mt-1">
            JPG, PNG, WebP, SVG حتى 5 ميجابايت
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white p-12 text-center text-neutral-500 border border-neutral-200">
            لا توجد وسائط أو صور مرفوعة بعد.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="aspect-square w-full overflow-hidden bg-neutral-100 relative">
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              <div className="p-3 border-t border-neutral-100 bg-white space-y-2">
                <div className="text-xs font-medium text-neutral-900 truncate" title={file.originalName}>
                  {file.originalName}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {(file.sizeBytes / 1024).toFixed(1)} KB
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleCopyUrl(file.id, file.url)}
                    className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-200"
                    title="نسخ الرابط"
                  >
                    {copiedId === file.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(file)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
