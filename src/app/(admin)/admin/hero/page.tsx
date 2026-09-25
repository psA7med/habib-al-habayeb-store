import { getHeroSettings } from "./actions"
import { HeroSettingsForm } from "./hero-settings-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "إعدادات الهيرو والإعلانات — لوحة التحكم | حبيب الحبايب",
}

export default async function AdminHeroSettingsPage() {
  const settings = await getHeroSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          إعدادات الهيرو والإعلانات
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          تخصيص صور واجهة المتجر وشريط الإعلان في الصفحة الرئيسية.
        </p>
      </div>

      <HeroSettingsForm initialSettings={settings as any} />
    </div>
  )
}
