"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  analyzeCsvContent,
  executeCsvImportAction,
  type CsvAnalysisResult,
  type ImportReport,
} from "./actions"

export function CsvImporter() {
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "report">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [analysis, setAnalysis] = useState<CsvAnalysisResult | null>(null)
  const [categoryActions, setCategoryActions] = useState<
    Record<string, { action: "map" | "create" | "ignore"; targetCategoryId?: string }>
  >({})
  const [report, setReport] = useState<ImportReport | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)
    setError(null)

    try {
      // Read as text (supports UTF-8 with Arabic)
      const text = await selectedFile.text()
      const result = await analyzeCsvContent(text)

      setAnalysis(result)

      // Initialize default category actions
      const initialActions: Record<
        string,
        { action: "map" | "create" | "ignore"; targetCategoryId?: string }
      > = {}

      for (const unknownCat of result.unknownCategories) {
        initialActions[unknownCat] = { action: "create" }
      }
      for (const knownCat of result.detectedCategories.filter(
        (c) => !result.unknownCategories.includes(c)
      )) {
        const match = result.existingCategories.find(
          (ec) => ec.nameAr.toLowerCase() === knownCat.toLowerCase()
        )
        initialActions[knownCat] = {
          action: "map",
          targetCategoryId: match?.id,
        }
      }

      setCategoryActions(initialActions)
      setStep("preview")
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء قراءة ملف CSV.")
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteImport = async () => {
    if (!analysis) return

    setStep("importing")
    setError(null)

    try {
      // Filter out invalid rows from import submission
      const validRowsToImport = analysis.previewRows
        .filter((r) => !r.validationError && r.mappedData)
        .map((r) => r.mappedData!)

      const importReport = await executeCsvImportAction({
        rows: validRowsToImport,
        categoryMappings: categoryActions,
      })

      setReport(importReport)
      setStep("report")
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء استيراد المنتجات.")
      setStep("preview")
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            رفع ملف CSV لمنتجات السوبر ماركت
          </h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">
            يدعم الملفات باللغة العربية (UTF-8). سيتم التعرف تلقائياً على الأعمدة (الاسم، السعر، الكود، القسم، الكمية).
          </p>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-neutral-800 transition-colors">
            <span>{loading ? "جاري فحص الملف..." : "اختر ملف CSV من جهازك"}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* STEP 2: PREVIEW & CATEGORY MAPPING */}
      {step === "preview" && analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-xs text-neutral-500">إجمالي الصفوف</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{analysis.totalRows}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="text-xs text-emerald-700">جاهزة للاستيراد</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {analysis.validRowsCount}
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="text-xs text-amber-700">منتجات مكررة (تنبيه)</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{analysis.duplicateCount}</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
              <div className="text-xs text-red-700">صفوف غير صالحة (تُستبعد)</div>
              <div className="text-2xl font-bold text-red-700 mt-1">
                {analysis.invalidRowsCount}
              </div>
            </div>
          </div>

          {/* Unknown Categories Configuration */}
          {analysis.unknownCategories.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6">
              <div className="flex items-center gap-2 text-amber-900 font-bold mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>أقسام جديدة تم اكتشافها في الملف ({analysis.unknownCategories.length})</span>
              </div>
              <p className="text-xs text-amber-800 mb-4">
                الرجاء تحديد الإجراء المطلوب لكل قسم غير موجود مسبقاً (لن يتم إنشاء أي قسم تلقائياً دون موافقتك):
              </p>

              <div className="space-y-3">
                {analysis.unknownCategories.map((unknownCat) => (
                  <div
                    key={unknownCat}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-3 border border-neutral-200 text-sm"
                  >
                    <span className="font-semibold text-neutral-900">قسم: {unknownCat}</span>
                    <div className="flex items-center gap-3">
                      <select
                        value={categoryActions[unknownCat]?.action || "create"}
                        onChange={(e) => {
                          const action = e.target.value as "map" | "create" | "ignore"
                          setCategoryActions((prev) => ({
                            ...prev,
                            [unknownCat]: { ...prev[unknownCat], action },
                          }))
                        }}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs bg-neutral-50"
                      >
                        <option value="create">إنشاء قسم جديد بهذا الاسم</option>
                        <option value="map">ربطه بقسم موجود مسبقاً</option>
                        <option value="ignore">تجاهل القسم (بدون تصنيف)</option>
                      </select>

                      {categoryActions[unknownCat]?.action === "map" && (
                        <select
                          value={categoryActions[unknownCat]?.targetCategoryId || ""}
                          onChange={(e) => {
                            setCategoryActions((prev) => ({
                              ...prev,
                              [unknownCat]: {
                                ...prev[unknownCat],
                                targetCategoryId: e.target.value,
                              },
                            }))
                          }}
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs"
                        >
                          <option value="">اختر القسم المستهدف...</option>
                          {analysis.existingCategories.map((ec) => (
                            <option key={ec.id} value={ec.id}>
                              {ec.nameAr}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h3 className="font-bold text-neutral-900 text-sm">
                معاينة الصفوف الأولى من الملف (حتى 100 صف)
              </h3>
              <span className="text-xs text-neutral-500">
                الحالة الافتراضية بعد الاستيراد: <strong className="text-neutral-800">مسودة (Draft)</strong>
              </span>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-neutral-100 border-b border-neutral-200 font-semibold text-neutral-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم المنتج</th>
                    <th className="p-3">السعر</th>
                    <th className="p-3">الكود (SKU)</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {analysis.previewRows.map((row) => (
                    <tr
                      key={row.index}
                      className={
                        row.validationError
                          ? "bg-red-50/60"
                          : row.isDuplicate
                          ? "bg-amber-50/40"
                          : "hover:bg-neutral-50"
                      }
                    >
                      <td className="p-3 text-neutral-500">{row.index}</td>
                      <td className="p-3 font-medium text-neutral-900">
                        {row.mappedData?.nameAr || "-"}
                      </td>
                      <td className="p-3 font-semibold text-neutral-800">
                        {row.mappedData?.priceEgp ? `${row.mappedData.priceEgp} ج.م` : "-"}
                      </td>
                      <td className="p-3 text-neutral-600 font-mono">
                        {row.mappedData?.sku || "-"}
                      </td>
                      <td className="p-3 text-neutral-600">
                        {row.mappedData?.categoryName || "-"}
                      </td>
                      <td className="p-3 text-neutral-600">
                        {row.mappedData?.quantity ?? 0}
                      </td>
                      <td className="p-3">
                        {row.validationError ? (
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                            <XCircle className="h-3.5 w-3.5" />
                            {row.validationError}
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {row.duplicateReason}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            صالح
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload")
                setAnalysis(null)
              }}
            >
              إلغاء واختيار ملف آخر
            </Button>

            <Button
              onClick={handleExecuteImport}
              disabled={analysis.validRowsCount === 0}
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              تأكيد واستيراد {analysis.validRowsCount} منتج
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: IMPORTING */}
      {step === "importing" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-neutral-900 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">جاري استيراد المنتجات...</h2>
          <p className="text-sm text-neutral-600">
            يتم حفظ المنتجات في قاعدة البيانات مع ربط الأقسام وتعيين الحالة كمسودة.
          </p>
        </div>
      )}

      {/* STEP 4: REPORT */}
      {step === "report" && report && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-neutral-900">تم اكتمال الاستيراد بنجاح!</h2>
            <p className="text-sm text-neutral-600 mt-1">
              تم إدراج المنتجات في قاعدة البيانات بنجاح كمسودات (Draft).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
              <div className="text-xs text-neutral-500">المنتجات المستوردة</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {report.importedCount}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
              <div className="text-xs text-neutral-500">أقسام تم إنشاؤها</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {report.categoriesCreatedCount}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
              <div className="text-xs text-neutral-500">صفوف غير مستوردة</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {report.failedCount}
              </div>
            </div>
          </div>

          {report.errors.length > 0 && (
            <div className="text-right text-xs text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 max-h-40 overflow-y-auto">
              <div className="font-bold mb-1">الملاحظات والأخطاء:</div>
              <ul className="list-disc list-inside space-y-1">
                {report.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={() => router.push("/admin/products")}
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              عرض قائمة المنتجات
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload")
                setAnalysis(null)
                setReport(null)
              }}
            >
              استيراد ملف آخر
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
