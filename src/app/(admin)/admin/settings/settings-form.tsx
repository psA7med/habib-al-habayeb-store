"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateSiteSettingsAction, type SiteSettingsFormData } from "./actions"

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [storeName, setStoreName] = useState(initialSettings.storeName || "حبيب الحبايب")
  const [announcementText, setAnnouncementText] = useState(
    initialSettings.announcementText || "أول سوبر ماركت أونلاين في الغنايم"
  )
  const [hotline, setHotline] = useState(initialSettings.hotline || "")
  const [whatsapp, setWhatsapp] = useState(initialSettings.whatsapp || "")
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail || "")
  const [standardDeliveryFeeEgp, setStandardDeliveryFeeEgp] = useState<string>(
    initialSettings.standardDeliveryFee !== undefined
      ? String(initialSettings.standardDeliveryFee / 100)
      : "0"
  )
  const [freeDeliveryThresholdEgp, setFreeDeliveryThresholdEgp] = useState<string>(
    initialSettings.freeDeliveryThreshold
      ? String(initialSettings.freeDeliveryThreshold / 100)
      : ""
  )
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialSettings.maintenanceMode ?? false
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await updateSiteSettingsAction({
        storeName: storeName.trim(),
        announcementText: announcementText.trim(),
        hotline: hotline.trim(),
        whatsapp: whatsapp.trim(),
        contactEmail: contactEmail.trim(),
        standardDeliveryFeeEgp: parseFloat(standardDeliveryFeeEgp) || 0,
        freeDeliveryThresholdEgp: freeDeliveryThresholdEgp
          ? parseFloat(freeDeliveryThresholdEgp)
          : null,
        maintenanceMode,
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
          تم حفظ إعدادات المتجر بنجاح!
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Store Identity */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900">هوية المتجر</h2>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            اسم المتجر <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            شريط الإعلان أعلى المتجر
          </label>
          <input
            type="text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="أول سوبر ماركت أونلاين في الغنايم"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Delivery & Shipping */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900">إعدادات التوصيل والشحن</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              تكلفة التوصيل الافتراضية (بالجنيه المصري)
            </label>
            <input
              type="number"
              step="0.5"
              value={standardDeliveryFeeEgp}
              onChange={(e) => setStandardDeliveryFeeEgp(e.target.value)}
              placeholder="0"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              حد التوصيل المجاني (بالجنيه المصري، اختياري)
            </label>
            <input
              type="number"
              step="1"
              value={freeDeliveryThresholdEgp}
              onChange={(e) => setFreeDeliveryThresholdEgp(e.target.value)}
              placeholder="مثال: 500"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900">بيانات التواصل والخدمة</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              رقم الهاتف / الخط الساخن
            </label>
            <input
              type="text"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              placeholder="010..."
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              رقم الواتساب
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="010..."
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              البريد الإلكتروني للتواصل
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@habib.store"
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-neutral-900 text-white hover:bg-neutral-800 px-8"
        >
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  )
}
