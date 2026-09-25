"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateHeroSettingsAction, type HeroFormData } from "./actions"

export function HeroSettingsForm({ initialSettings }: { initialSettings: HeroFormData }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [desktopImageUrl, setDesktopImageUrl] = useState(
    initialSettings.desktopImageUrl || "/hero-desktop.webp"
  )
  const [mobileImageUrl, setMobileImageUrl] = useState(
    initialSettings.mobileImageUrl || "/hero-mobile.webp"
  )
  const [announcementText, setAnnouncementText] = useState(
    initialSettings.announcementText || "أول سوبر ماركت أونلاين في الغنايم"
  )
  const [isEnabled, setIsEnabled] = useState(initialSettings.isEnabled ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await updateHeroSettingsAction({
        desktopImageUrl,
        mobileImageUrl,
        announcementText,
        isEnabled,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ الإعدادات")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          تم حفظ إعدادات الهيرو بنجاح وتحديث المتجر!
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Desktop Image */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900">صورة سطح المكتب (Desktop 16:9)</h2>
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
          <img
            src={desktopImageUrl}
            alt="Hero Desktop"
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = "none"
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            رابط الصورة (URL)
          </label>
          <input
            type="text"
            required
            value={desktopImageUrl}
            onChange={(e) => setDesktopImageUrl(e.target.value)}
            dir="ltr"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Mobile Image */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900">صورة الموبايل (Mobile 9:16)</h2>
        <div className="h-64 w-36 mx-auto rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
          <img
            src={mobileImageUrl}
            alt="Hero Mobile"
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = "none"
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            رابط الصورة (URL)
          </label>
          <input
            type="text"
            required
            value={mobileImageUrl}
            onChange={(e) => setMobileImageUrl(e.target.value)}
            dir="ltr"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Announcement */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900">نص شريط الإعلانات</h2>
        <div>
          <input
            type="text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="أول سوبر ماركت أونلاين في الغنايم"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isEnabled"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
          />
          <label htmlFor="isEnabled" className="text-sm font-medium text-neutral-800">
            تفعيل قسم الهيرو في الصفحة الرئيسية
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-neutral-900 text-white hover:bg-neutral-800 px-8"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </form>
  )
}
