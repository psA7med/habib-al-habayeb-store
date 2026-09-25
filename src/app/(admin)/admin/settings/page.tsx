import { getSiteSettings } from "./actions"
import { SettingsForm } from "./settings-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "إعدادات المتجر — لوحة التحكم | حبيب الحبايب",
}

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">إعدادات المتجر</h1>
        <p className="mt-1 text-sm text-neutral-600">
          إدارة اسم المتجر، أسعار الشحن، بيانات التواصل، ورسائل الإعلان.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  )
}
