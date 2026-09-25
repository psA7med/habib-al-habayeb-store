import { CsvImporter } from "./csv-importer"

export const metadata = {
  title: "استيراد المنتجات من CSV — لوحة التحكم | حبيب الحبايب",
  description: "استيراد منتجات السوبر ماركت دفعة واحدة من ملف CSV",
}

export default function AdminProductImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          استيراد منتجات السوبر ماركت (CSV)
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          أداة استيراد الدفعات مع معالجة الأسماء العربية، ومطابقة الأقسام، واكتشاف التكرارات تلقائياً.
        </p>
      </div>

      <CsvImporter />
    </div>
  )
}
